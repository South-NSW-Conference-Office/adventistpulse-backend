/**
 * Survey Service — Survey Session + Response business logic.
 *
 * All auth-scoped operations use conferenceCode from req.user.subscription.conferenceCode.
 * conferenceCode is NEVER accepted from the request body.
 *
 * Score computation is entirely server-side — client answers are validated
 * but scores are never trusted from the client.
 */

import QRCode              from 'qrcode'
import { randomBytes }     from 'crypto'
import { SurveySession }   from '../models/SurveySession.js'
import { SurveyResponse }  from '../models/SurveyResponse.js'
import { OrgUnit }         from '../models/OrgUnit.js'
import { AppError, NotFoundError, ForbiddenError } from '../core/errors/index.js'
import { getPaginationParams }  from '../lib/paginate.js'
import { env }             from '../config/env.js'

// ─── Scoring Constants ─────────────────────────────────────────────────────────

const DIM_WEIGHTS = {
  spiritual:  0.25,
  community:  0.25,
  financial:  0.10,
  mission:    0.20,
  leadership: 0.20,
}

const QUESTION_DIMENSIONS = {
  'SV-1': 'spiritual', 'SV-2': 'spiritual', 'SV-3': 'spiritual',
  'SV-4': 'spiritual', 'SV-5': 'spiritual', 'SV-6': 'spiritual',
  'CH-1': 'community', 'CH-2': 'community', 'CH-3': 'community',
  'CH-4': 'community', 'CH-5': 'community', 'CH-6': 'community',
  'FS-1': 'financial', 'FS-2': 'financial', 'FS-3': 'financial', 'FS-4': 'financial',
  'ME-1': 'mission',   'ME-2': 'mission',   'ME-3': 'mission',
  'ME-4': 'mission',   'ME-5': 'mission',   'ME-6': 'mission',
  'LG-1': 'leadership', 'LG-2': 'leadership', 'LG-3': 'leadership',
  'LG-4': 'leadership', 'LG-5': 'leadership',
}

// Dimension metadata for results response
const DIM_META = {
  spiritual:  { label: 'Spiritual Vitality',      color: '#6366F1' },
  community:  { label: 'Community Health',        color: '#10b981' },
  financial:  { label: 'Financial Stewardship',   color: '#f59e0b' },
  mission:    { label: 'Mission Engagement',      color: '#ef4444' },
  leadership: { label: 'Leadership & Governance', color: '#8b5cf6' },
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Compute per-dimension scores and overall weighted score from raw answers.
 * All 27 questions are always scored regardless of denominationType
 * (non-Adventist respondents use altText on the frontend but answers map identically).
 *
 * dimScore = (avgLikert / 5) * 100
 * overallScore = Σ (dimScore × weight)
 */
function computeScores(answers) {
  // Group answers by dimension
  const dimTotals = { spiritual: 0, community: 0, financial: 0, mission: 0, leadership: 0 }
  const dimCounts = { spiritual: 0, community: 0, financial: 0, mission: 0, leadership: 0 }

  for (const [qId, value] of Object.entries(answers)) {
    const dim = QUESTION_DIMENSIONS[qId]
    if (!dim) continue
    dimTotals[dim] += value
    dimCounts[dim] += 1
  }

  const dimScores = {}
  for (const dim of Object.keys(DIM_WEIGHTS)) {
    const count = dimCounts[dim]
    const avg   = count > 0 ? dimTotals[dim] / count : 0
    dimScores[dim] = Math.round((avg / 5) * 100 * 10) / 10  // 1 decimal place
  }

  const overallScore = Math.round(
    Object.entries(DIM_WEIGHTS).reduce((sum, [dim, weight]) => sum + dimScores[dim] * weight, 0)
  )

  return { dimScores, overallScore }
}

function getBand(score) {
  if (score >= 80) return { label: 'Thriving',        color: '#10b981' }
  if (score >= 60) return { label: 'Healthy',         color: '#eab308' }
  if (score >= 40) return { label: 'Growing',         color: '#f97316' }
  return               { label: 'Needs Attention',   color: '#ef4444' }
}

/**
 * Generate a cryptographically random 6-char uppercase alphanumeric session code.
 * Uses crypto.randomBytes instead of Math.random() for better randomness.
 * Excludes visually ambiguous characters (I, O, 0, 1).
 */
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1 to avoid confusion
  const bytes = randomBytes(6)
  return Array.from(bytes).map(b => chars[b % chars.length]).join('')
}

/**
 * Verify churchCode is a real church AND belongs to the given conference.
 * Throws AppError 404 or 403 if not.
 */
async function assertChurchInConference(churchCode, conferenceCode) {
  const church = await OrgUnit.findOne({ code: churchCode.toUpperCase(), level: 'church' }).lean()
  if (!church) throw new NotFoundError(`Church '${churchCode}'`)

  if (church.parentCode?.toUpperCase() !== conferenceCode.toUpperCase()) {
    throw new ForbiddenError(`Church '${churchCode}' does not belong to your conference`)
  }

  return church
}

// ─── Survey Service ────────────────────────────────────────────────────────────

export const surveyService = {

  /**
   * Create a new survey session.
   * - Validates church exists and belongs to the user's conference.
   * - Generates a unique 6-char sessionCode (retry on collision).
   * - Generates a QR code PNG as a base64 data URL.
   */
  async createSession(createdBy, conferenceCode, body) {
    const { churchCode, settings = {} } = body

    const church = await assertChurchInConference(churchCode, conferenceCode)

    const expiryMinutes = settings.expiryMinutes ?? 60
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000)

    // Generate unique sessionCode — retry on collision (extremely rare)
    let sessionCode
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = generateCode()
      const exists = await SurveySession.exists({ sessionCode: candidate })
      if (!exists) { sessionCode = candidate; break }
    }
    if (!sessionCode) throw new AppError('Failed to generate unique session code — please retry', { code: 'SESSION_CODE_COLLISION', statusCode: 500 })

    // Build respondent URL and QR code
    const respondentUrl = `${env.FRONTEND_URL}/vitality-check/session/${sessionCode}`
    const qrDataUrl     = await QRCode.toDataURL(respondentUrl, { type: 'image/png', width: 300 })

    const session = await SurveySession.create({
      churchCode:     churchCode.toUpperCase(),
      createdBy,
      conferenceCode: conferenceCode.toUpperCase(),
      sessionCode,
      qrDataUrl,
      expiresAt,
      settings: {
        requirePhone:     settings.requirePhone     ?? false,
        maxResponses:     settings.maxResponses     ?? null,
        expiryMinutes:    expiryMinutes,
        denominationType: settings.denominationType ?? 'auto',
      },
    })

    return {
      id:           session._id,
      sessionCode:  session.sessionCode,
      qrDataUrl:    session.qrDataUrl,
      respondentUrl,
      expiresAt:    session.expiresAt,
      status:       session.status,
      churchName:   church.name,
    }
  },

  /**
   * Get minimal session info for public respondents.
   * Returns 404 for unknown sessions, 410 Gone for expired/closed.
   */
  async getSessionPublic(code) {
    const session = await SurveySession.findOne({ sessionCode: code.toUpperCase() }).lean()
    if (!session) throw new NotFoundError(`Survey session '${code}'`)

    const isExpired = session.expiresAt < new Date()
    const isClosed  = session.status === 'closed'

    if (isExpired || isClosed) {
      throw new AppError(
        isClosed ? 'This survey session has been closed.' : 'This survey session has expired.',
        { code: 'SESSION_GONE', statusCode: 410 }
      )
    }

    // Fetch church name for display
    const church = await OrgUnit.findOne({ code: session.churchCode }, { name: 1 }).lean()

    return {
      sessionCode:  session.sessionCode,
      churchName:   church?.name ?? session.churchCode,
      status:       session.status,
      expiresAt:    session.expiresAt,
      settings: {
        requirePhone:     session.settings?.requirePhone ?? false,
        denominationType: session.settings?.denominationType ?? 'auto',
      },
    }
  },

  /**
   * Submit a response to an active session.
   * - Validates session is active, not expired, within maxResponses.
   * - Computes dimScores + overallScore server-side.
   * - Checks dedupeToken uniqueness via DB partial index.
   * - Increments responseCount.
   */
  async respond(code, body) {
    const { answers, denominationType, dedupeToken } = body
    // phoneHash is intentionally NOT accepted from the client.
    // Phase 2: when requirePhone=true, accept raw `phone` and hash server-side.
    const phoneHash = null

    const session = await SurveySession.findOne({ sessionCode: code.toUpperCase() })
    if (!session) throw new NotFoundError(`Survey session '${code}'`)

    const isExpired = session.expiresAt < new Date()
    const isClosed  = session.status === 'closed'

    if (isExpired || isClosed) {
      throw new AppError(
        isClosed ? 'This survey session has been closed.' : 'This survey session has expired.',
        { code: 'SESSION_GONE', statusCode: 410 }
      )
    }

    if (session.settings?.maxResponses != null && session.responseCount >= session.settings.maxResponses) {
      throw new AppError(
        'This survey has reached its maximum number of responses.',
        { code: 'MAX_RESPONSES_REACHED', statusCode: 409 }
      )
    }

    // Compute scores server-side — never trust client
    const { dimScores, overallScore } = computeScores(answers)

    // Resolve denominationType: if session is 'auto', use what the respondent chose
    // Otherwise lock to the session's setting
    const sessionDenomType = session.settings?.denominationType ?? 'auto'
    const effectiveDenomType = sessionDenomType === 'auto' ? denominationType : sessionDenomType

    // Save response — unique index on {sessionId, dedupeToken} will catch duplicates
    try {
      await SurveyResponse.create({
        sessionId:        session._id,
        churchCode:       session.churchCode,
        conferenceCode:   session.conferenceCode,
        answers:          new Map(Object.entries(answers)),
        dimScores,
        overallScore,
        denominationType: effectiveDenomType,
        dedupeToken,
        phoneHash,
      })
    } catch (err) {
      // MongoDB duplicate key error code 11000 = dedupeToken collision
      if (err.code === 11000) {
        throw new AppError(
          "You've already completed this assessment.",
          { code: 'DUPLICATE_RESPONSE', statusCode: 409 }
        )
      }
      throw err
    }

    // Increment responseCount — use $inc for atomicity
    await SurveySession.updateOne({ _id: session._id }, { $inc: { responseCount: 1 } })

    return { submitted: true }
  },

  /**
   * Aggregate results for a session.
   * Caller must be the session creator or in the same conference.
   */
  async getResults(sessionId, requestingUserId, requestingConference) {
    const session = await SurveySession.findById(sessionId).lean()
    if (!session) throw new NotFoundError('Survey session')

    // Authorization: must be creator OR same conference
    const isCreator   = session.createdBy.toString() === requestingUserId.toString()
    const isConference = session.conferenceCode === requestingConference?.toUpperCase()
    if (!isCreator && !isConference) throw new ForbiddenError()

    if (session.responseCount === 0) {
      return {
        sessionCode:   session.sessionCode,
        responseCount: 0,
        overallAvg:    null,
        band:          null,
        bandColor:     null,
        dimensions:    Object.entries(DIM_META).map(([id, meta]) => ({
          id,
          label: meta.label,
          score: null,
          color: meta.color,
        })),
        updatedAt: new Date(),
      }
    }

    const [agg] = await SurveyResponse.aggregate([
      { $match: { sessionId: session._id } },
      { $group: {
        _id:        null,
        spiritual:  { $avg: '$dimScores.spiritual' },
        community:  { $avg: '$dimScores.community' },
        financial:  { $avg: '$dimScores.financial' },
        mission:    { $avg: '$dimScores.mission' },
        leadership: { $avg: '$dimScores.leadership' },
        overallAvg: { $avg: '$overallScore' },
      }},
    ])

    const overallAvg = Math.round((agg?.overallAvg ?? 0) * 10) / 10
    const band = getBand(overallAvg)

    const dimensions = Object.entries(DIM_META).map(([id, meta]) => ({
      id,
      label: meta.label,
      score: Math.round((agg?.[id] ?? 0) * 10) / 10,
      color: meta.color,
    }))

    return {
      sessionCode:   session.sessionCode,
      responseCount: session.responseCount,
      overallAvg,
      band:          band.label,
      bandColor:     band.color,
      dimensions,
      updatedAt:     new Date(),
    }
  },

  /**
   * Close an active session.
   * Caller must be the session creator or in the same conference.
   */
  async closeSession(sessionId, requestingUserId, requestingConference) {
    const session = await SurveySession.findById(sessionId)
    if (!session) throw new NotFoundError('Survey session')

    const isCreator    = session.createdBy.toString() === requestingUserId.toString()
    const isConference = session.conferenceCode === requestingConference?.toUpperCase()
    if (!isCreator && !isConference) throw new ForbiddenError()

    if (session.status === 'closed') {
      throw new AppError('Session is already closed', { code: 'SESSION_ALREADY_CLOSED', statusCode: 409 })
    }

    session.status   = 'closed'
    session.closedAt = new Date()
    await session.save()

    return { closed: true }
  },

  /**
   * List sessions for a conference with pagination.
   * Pastor can filter by churchCode and/or status.
   *
   * IMPORTANT: When filtering for 'active' sessions, also exclude expired ones.
   * A session can be status='active' but past its expiresAt — treat as expired.
   */
  async listSessions(conferenceCode, query) {
    const { page, limit, skip } = getPaginationParams(query)

    const filter = { conferenceCode: conferenceCode.toUpperCase() }
    if (query.churchCode) filter.churchCode = query.churchCode.toUpperCase()

    if (query.status === 'active') {
      // Active = status is 'active' AND not yet expired
      filter.status    = 'active'
      filter.expiresAt = { $gt: new Date() }
    } else if (query.status === 'closed') {
      // Closed includes both explicitly closed AND expired-but-not-closed
      filter.$or = [
        { status: 'closed' },
        { status: 'active', expiresAt: { $lte: new Date() } },
      ]
    } else if (query.status) {
      filter.status = query.status
    }

    const [data, total] = await Promise.all([
      SurveySession.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-qrDataUrl')  // QR data URLs are large — omit from list
        .lean(),
      SurveySession.countDocuments(filter),
    ])

    return { data, total, page, limit }
  },
}
