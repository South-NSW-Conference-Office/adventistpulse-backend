import { Survey } from '../models/Survey.js'
import { SurveySession } from '../models/SurveySession.js'
import { SurveyEngineResponse } from '../models/SurveyEngineResponse.js'
import { NotFoundError, ForbiddenError, ValidationError } from '../core/errors/index.js'
import crypto from 'crypto'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a unique 8-char session code */
function generateSessionCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase()
}

/** Verify the caller owns or administers the survey */
function assertOwner(survey, userId, userRole) {
  if (survey.owner.toString() !== userId.toString() && userRole !== 'admin') {
    throw new ForbiddenError('You do not have permission to modify this survey')
  }
}

// ─── Survey CRUD ──────────────────────────────────────────────────────────────

/**
 * Create a new survey in draft state.
 * @param {object} data  Validated body from createSurveySchema
 * @param {object} user  Authenticated user
 */
export async function createSurvey(data, user) {
  const survey = new Survey({
    title:       data.title,
    description: data.description ?? '',
    questions:   data.questions ?? [],
    owner:       user._id,
    ownerOrg:    (() => { const code = user.subscription?.conferenceCode; if (!code) throw new ValidationError('No conference assigned to your account'); return code.toUpperCase() })(),
    template:    data.template ?? null,
    settings: {
      anonymous:    data.settings?.anonymous ?? true,
      closeDate:    data.settings?.closeDate ? new Date(data.settings.closeDate) : null,
      maxResponses: data.settings?.maxResponses ?? null,
    },
    status: 'draft',
  })
  await survey.save()
  return survey
}

/**
 * List surveys owned by the user (or visible to their org).
 */
export async function listSurveys(user) {
  const filter = user.role === 'admin'
    ? { ownerOrg: user.subscription?.conferenceCode }
    : { owner: user._id }
  return Survey.find(filter).sort({ createdAt: -1 }).lean()
}

/**
 * Get a single survey by ID.
 */
export async function getSurvey(id, user) {
  const survey = await Survey.findById(id).lean()
  if (survey == null) throw new NotFoundError('Survey not found')
  if (survey.owner.toString() !== user._id.toString() && user.role !== 'admin') {
    throw new ForbiddenError('Access denied')
  }
  return survey
}

/**
 * Update a draft survey.
 */
export async function updateSurvey(id, data, user) {
  const survey = await Survey.findById(id)
  if (survey == null) throw new NotFoundError('Survey not found')
  assertOwner(survey, user._id, user.role)
  if (survey.status !== 'draft') {
    throw new ValidationError('Only draft surveys can be edited')
  }

  if (data.title != null) survey.title = data.title
  if (data.description != null) survey.description = data.description
  if (data.questions != null) survey.questions = data.questions
  if (data.settings != null) {
    if (data.settings.anonymous != null) survey.settings.anonymous = data.settings.anonymous
    if (data.settings.closeDate != null) survey.settings.closeDate = new Date(data.settings.closeDate)
    if (data.settings.maxResponses != null) survey.settings.maxResponses = data.settings.maxResponses
  }

  await survey.save()
  return survey
}

/**
 * Delete a draft survey.
 */
export async function deleteSurvey(id, user) {
  const survey = await Survey.findById(id)
  if (survey == null) throw new NotFoundError('Survey not found')
  assertOwner(survey, user._id, user.role)
  if (survey.status !== 'draft') {
    throw new ValidationError('Only draft surveys can be deleted')
  }
  await survey.deleteOne()
}

// ─── Publish & Targeting ──────────────────────────────────────────────────────

/**
 * Publish a survey: sets targeting and creates one SurveySession per church.
 * Returns the survey + created sessions.
 */
export async function publishSurvey(id, data, user) {
  const survey = await Survey.findById(id)
  if (survey == null) throw new NotFoundError('Survey not found')
  assertOwner(survey, user._id, user.role)
  if (survey.status === 'closed') throw new ValidationError('Closed surveys cannot be republished')
  if (survey.questions.length === 0) throw new ValidationError('Survey must have at least one question')

  // Resolve target church codes
  const { targeting, settings } = data
  let churchCodes = targeting.churchCodes ?? []

  // For conference/union scope with no explicit churchCodes, caller must provide them
  // (frontend sends the resolved list after user picks from the church selector)
  if (churchCodes.length === 0) {
    throw new ValidationError('At least one target church code is required')
  }

  // Update survey
  survey.targeting = {
    scope:          targeting.scope,
    churchCodes,
    conferenceCode: targeting.conferenceCode ?? null,
    unionCode:      targeting.unionCode ?? null,
  }
  if (settings?.closeDate) survey.settings.closeDate = new Date(settings.closeDate)
  if (settings?.maxResponses) survey.settings.maxResponses = settings.maxResponses
  survey.status      = 'published'
  survey.publishedAt = new Date()
  await survey.save()

  // Create one SurveySession per church (idempotent — skip if already exists)
  const expiryMs     = survey.settings.closeDate
    ? survey.settings.closeDate.getTime() - Date.now()
    : 30 * 24 * 60 * 60 * 1000 // 30 days default
  const expiryMinutes = Math.max(15, Math.round(expiryMs / 60000))

  const sessions = []
  for (const churchCode of churchCodes) {
    const existing = await SurveySession.findOne({
      churchCode,
      createdBy: user._id,
      status: 'active',
    })
    if (existing != null) {
      sessions.push(existing)
      continue
    }

    let sessionCode
    let collision = true
    while (collision) {
      sessionCode = generateSessionCode()
      collision = !!(await SurveySession.findOne({ sessionCode }))
    }

    const session = new SurveySession({
      churchCode,
      createdBy:      user._id,
      conferenceCode: user.subscription?.conferenceCode?.toUpperCase() ?? survey.ownerOrg,
      sessionCode,
      status:         'active',
      expiresAt:      new Date(Date.now() + expiryMs),
      settings: {
        expiryMinutes: Math.min(expiryMinutes, 480),
      },
      // Extension: link back to Survey
      surveyId:   survey._id,
      surveyType: 'custom',
    })
    await session.save()
    sessions.push(session)
  }

  return { survey, sessions }
}

/**
 * Close a survey.
 */
export async function closeSurvey(id, user) {
  const survey = await Survey.findById(id)
  if (survey == null) throw new NotFoundError('Survey not found')
  assertOwner(survey, user._id, user.role)
  survey.status   = 'closed'
  survey.closedAt = new Date()
  await survey.save()

  // Close all active sessions for this survey
  await SurveySession.updateMany(
    { surveyId: survey._id, status: 'active' },
    { status: 'closed', closedAt: new Date() },
  )

  return survey
}

// ─── Responses ────────────────────────────────────────────────────────────────

/**
 * Submit a response to a custom survey.
 * Public endpoint — no auth required.
 */
export async function submitEngineResponse(data) {
  const session = await SurveySession.findOne({ sessionCode: data.sessionCode, status: 'active' })
  if (session == null) throw new NotFoundError('Session not found or already closed')
  if (session.surveyId == null) throw new ValidationError('This session is for Vitality Check, not a custom survey')
  if (session.expiresAt < new Date()) throw new ValidationError('Session has expired')

  const survey = await Survey.findById(session.surveyId).lean()
  if (survey == null) throw new NotFoundError('Survey not found')

  // Validate all required questions are answered
  const answeredIds = Object.keys(data.answers)
  for (const q of survey.questions) {
    if (q.required && !answeredIds.includes(q.questionId)) {
      throw new ValidationError(`Question "${q.questionId}" is required`)
    }
  }

  // Validate each submitted answer against its question type
  for (const q of survey.questions) {
    const answer = data.answers[q.questionId]
    if (answer == null) continue // unanswered optional question — skip

    if (q.type === 'likert') {
      const min = q.scale?.min ?? 1
      const max = q.scale?.max ?? 5
      if (typeof answer !== 'number' || !Number.isInteger(answer) || answer < min || answer > max) {
        throw new ValidationError(`Answer to "${q.questionId}" must be an integer between ${min} and ${max}`)
      }
    } else if (q.type === 'nps') {
      if (typeof answer !== 'number' || !Number.isInteger(answer) || answer < 0 || answer > 10) {
        throw new ValidationError(`Answer to "${q.questionId}" must be an integer between 0 and 10`)
      }
    } else if (q.type === 'yesno') {
      if (answer !== 'yes' && answer !== 'no') {
        throw new ValidationError(`Answer to "${q.questionId}" must be "yes" or "no"`)
      }
    } else if (q.type === 'multiplechoice') {
      const options = q.options ?? []
      const values = Array.isArray(answer) ? answer : [answer]
      for (const v of values) {
        if (!options.includes(v)) {
          throw new ValidationError(`Answer value "${v}" is not a valid option for question "${q.questionId}"`)
        }
      }
    }
  }

  const response = new SurveyEngineResponse({
    surveyId:       session.surveyId,
    sessionId:      session._id,
    churchCode:     session.churchCode,
    conferenceCode: session.conferenceCode,
    answers:        new Map(Object.entries(data.answers)),
    dedupeToken:    data.dedupeToken,
  })
  await response.save()

  // Increment counter
  session.responseCount += 1
  await session.save()

  return { success: true }
}

// ─── Results ──────────────────────────────────────────────────────────────────

/**
 * Aggregate results for a survey.
 * Returns per-question breakdowns and overall response count.
 */
export async function getSurveyResults(id, user) {
  const survey = await Survey.findById(id).lean()
  if (survey == null) throw new NotFoundError('Survey not found')
  if (survey.owner.toString() !== user._id.toString() && user.role !== 'admin') {
    throw new ForbiddenError('Access denied')
  }

  const responses = await SurveyEngineResponse.find({ surveyId: id }).lean()
  const totalResponses = responses.length

  // Per-question aggregation
  const questionResults = survey.questions.map(q => {
    const answers = responses
      .map(r => r.answers[q.questionId])
      .filter(a => a != null)

    if (q.type === 'likert' || q.type === 'nps') {
      const nums = answers.filter(a => typeof a === 'number')
      const avg = nums.length > 0 ? nums.reduce((s, n) => s + n, 0) / nums.length : null
      const distribution = {}
      nums.forEach(n => { distribution[n] = (distribution[n] ?? 0) + 1 })
      return { questionId: q.questionId, text: q.text, type: q.type, avg, distribution, count: nums.length }
    }

    if (q.type === 'yesno') {
      const yes = answers.filter(a => a === 'yes').length
      const no  = answers.filter(a => a === 'no').length
      return { questionId: q.questionId, text: q.text, type: q.type, yes, no, count: answers.length }
    }

    if (q.type === 'multiplechoice') {
      const tally = {}
      answers.forEach(a => {
        const values = Array.isArray(a) ? a : [a]
        values.forEach(v => { tally[v] = (tally[v] ?? 0) + 1 })
      })
      return { questionId: q.questionId, text: q.text, type: q.type, tally, count: answers.length }
    }

    if (q.type === 'text') {
      // Return raw text responses (anonymised — no identifying info)
      return { questionId: q.questionId, text: q.text, type: q.type, responses: answers.slice(0, 100), count: answers.length }
    }

    return { questionId: q.questionId, text: q.text, type: q.type, count: answers.length }
  })

  // Per-church breakdown
  const sessions = await SurveySession.find({ surveyId: id }).lean()
  const churchBreakdown = sessions.map(s => ({
    churchCode:    s.churchCode,
    sessionCode:   s.sessionCode,
    responseCount: s.responseCount,
    status:        s.status,
  }))

  return {
    surveyId:        id,
    title:           survey.title,
    status:          survey.status,
    totalResponses,
    questionResults,
    churchBreakdown,
  }
}
