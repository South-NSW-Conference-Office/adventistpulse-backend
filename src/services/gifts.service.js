/**
 * Gifts Assessment Service
 *
 * Business logic for the Spiritual Gifts feature.
 * Follows the same pattern as surveyEngine.service.js:
 *   pure service functions, no HTTP awareness, throws core/errors on failure.
 */

import crypto from 'crypto'
import { GiftAssessment } from '../models/GiftAssessment.js'
import { giftDefinitions } from '../lib/giftsEngine/giftDefinitions.js'
import { getAdventistGifts, adventistGiftMap, enrichWithAdventistContext } from '../lib/giftsEngine/adventistOverrides.js'
import {
  getAdventistQuestions,
  getStandardQuestions,
  getScreeningQuestions as getScreeningQs,
  getDeepQuestionsForGifts,
} from '../lib/giftsEngine/questions.js'
import {
  scoreAssessment,
  getTopGifts,
  getMinistryRecommendations,
  scorePhase1,
  getPhase2Candidates,
  scorePhase2,
  scoreFinal,
} from '../lib/giftsEngine/scoring.js'
import { NotFoundError, ValidationError } from '../core/errors/index.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a unique session token (URL-safe, 24 chars) */
function generateSessionToken() {
  return crypto.randomBytes(18).toString('base64url')
}

/** Resolve the gift set and question set for a given version */
function resolveVersion(version) {
  if (version === 'adventist') {
    return {
      gifts: getAdventistGifts(giftDefinitions),
      questions: getAdventistQuestions(),
    }
  }
  return {
    gifts: giftDefinitions,
    questions: getStandardQuestions(),
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Start a new assessment — creates a GiftAssessment in draft state.
 * Returns the sessionToken and the questions for the chosen version.
 */
export async function startAssessment({ firstName, lastName, email, churchCode, version = 'adventist', userId = null }) {
  const sessionToken = generateSessionToken()
  const { questions } = resolveVersion(version)

  // Set TTL for abandoned drafts — auto-deleted after 30 days if never completed.
  // Cleared to null when the assessment is completed (see submitResponses / submitPhase2).
  const DRAFT_TTL_DAYS = 30
  const draftExpiresAt = new Date(Date.now() + DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000)

  const assessment = new GiftAssessment({
    userId,
    churchCode: churchCode ?? null,
    sessionToken,
    firstName,
    lastName,
    email,
    version,
    expiresAt: draftExpiresAt,
  })
  await assessment.save()

  return {
    sessionToken,
    version,
    questionCount: questions.length,
    questions: questions.map(q => ({ id: q.id, giftId: q.giftId, text: q.text })),
  }
}

/**
 * Submit all responses for an assessment, score it, and persist the result.
 */
export async function submitResponses({ sessionToken, responses }) {
  const assessment = await GiftAssessment.findOne({ sessionToken })
  if (!assessment) throw new NotFoundError('Assessment not found')
  if (assessment.completedAt) throw new ValidationError('This assessment has already been submitted')

  const { gifts, questions } = resolveVersion(assessment.version)

  // Validate that every question has a response
  const questionIds = new Set(questions.map(q => q.id))
  const responseMap = new Map()
  for (const r of responses) {
    if (!questionIds.has(r.questionId)) {
      throw new ValidationError(`Unknown question: ${r.questionId}`)
    }
    if (r.score < 1 || r.score > 5 || !Number.isInteger(r.score)) {
      throw new ValidationError(`Score for ${r.questionId} must be an integer between 1 and 5`)
    }
    responseMap.set(r.questionId, r)
  }

  for (const q of questions) {
    if (!responseMap.has(q.id)) {
      throw new ValidationError(`Missing response for question: ${q.id}`)
    }
  }

  // Build normalised response array with giftId
  const normalisedResponses = questions.map(q => {
    const r = responseMap.get(q.id)
    return { questionId: q.id, giftId: q.giftId, score: r.score }
  })

  // Score
  const scored = scoreAssessment(normalisedResponses, gifts)
  const top = getTopGifts(scored, 3)

  // Ministry recommendations — use SDA map for adventist, generic for standard
  const ministryMap = assessment.version === 'adventist'
    ? adventistGiftMap
    : Object.fromEntries(gifts.map(g => [g.id, { ministryAreas: g.ministryAreas }]))
  const recommendations = getMinistryRecommendations(top, ministryMap)

  // Persist
  assessment.responses = normalisedResponses
  assessment.scores = scored
  assessment.primaryGift = top[0]?.giftId ?? null
  assessment.secondaryGift = top[1]?.giftId ?? null
  assessment.tertiaryGift = top[2]?.giftId ?? null
  assessment.ministryRecommendations = recommendations
  assessment.completedAt = new Date()
  assessment.expiresAt = null  // clear TTL — completed assessments are never auto-deleted
  await assessment.save()

  return formatResult(assessment, gifts)
}

/**
 * Get the result of a completed assessment by session token — authenticated version.
 * Returns full result including PII (name, email). Only call from auth-gated endpoints.
 */
export async function getResult(sessionToken) {
  const assessment = await GiftAssessment.findOne({ sessionToken }).lean()
  if (!assessment) throw new NotFoundError('Assessment not found')
  if (!assessment.completedAt) throw new ValidationError('Assessment has not been completed yet')

  const { gifts } = resolveVersion(assessment.version)
  return formatResult(assessment, gifts)
}

/**
 * Get the result of a completed assessment by session token — public version.
 * Email is redacted. Session tokens may be shared via QR/link to display results
 * to third parties, so PII must not be exposed on this endpoint.
 */
export async function getResultPublic(sessionToken) {
  const result = await getResult(sessionToken)
  const { email: _omit, ...safeResult } = result  // eslint-disable-line no-unused-vars
  return safeResult
}

/**
 * Claim an anonymous assessment — link it to an authenticated user.
 */
export async function claimAssessment({ sessionToken, userId }) {
  const assessment = await GiftAssessment.findOne({ sessionToken })
  if (!assessment) throw new NotFoundError('Assessment not found')
  if (assessment.userId) throw new ValidationError('This assessment has already been claimed')

  assessment.userId = userId
  assessment.claimedAt = new Date()
  await assessment.save()

  return { sessionToken, userId, claimedAt: assessment.claimedAt }
}

/**
 * Get all assessments for a logged-in user.
 */
export async function getMyAssessments(userId) {
  return GiftAssessment.find({ userId, completedAt: { $ne: null } })
    .sort({ completedAt: -1 })
    .select('-responses')
    .lean()
}

/**
 * Aggregate the gift profile for a church — distribution, gaps, top gifts.
 * Requires pastor/admin role (enforced in routes).
 */
export async function getChurchGiftProfile(churchCode) {
  const assessments = await GiftAssessment.find({
    churchCode: churchCode.toUpperCase(),
    completedAt: { $ne: null },
  }).lean()

  if (assessments.length === 0) {
    return {
      churchCode: churchCode.toUpperCase(),
      totalAssessments: 0,
      giftDistribution: [],
      topGifts: [],
      giftGaps: [],
    }
  }

  // Tally total scores across all assessments per gift
  const giftTotals = new Map()
  for (const a of assessments) {
    for (const s of a.scores) {
      const current = giftTotals.get(s.giftId) ?? { totalScore: 0, count: 0 }
      current.totalScore += s.totalScore
      current.count += 1
      giftTotals.set(s.giftId, current)
    }
  }

  // Build distribution sorted by average total score
  const distribution = []
  for (const [giftId, { totalScore, count }] of giftTotals) {
    distribution.push({
      giftId,
      avgTotalScore: Math.round((totalScore / count) * 100) / 100,
      assessmentCount: count,
    })
  }
  distribution.sort((a, b) => b.avgTotalScore - a.avgTotalScore)

  return {
    churchCode: churchCode.toUpperCase(),
    totalAssessments: assessments.length,
    giftDistribution: distribution,
    topGifts: distribution.slice(0, 5).map(d => d.giftId),
    giftGaps: distribution.slice(-5).map(d => d.giftId),
  }
}

// ─── Adaptive Two-Phase Functions ────────────────────────────────────────────

/**
 * Return the screening (Phase 1 anchor) questions for the given version.
 * No session required — used to pre-fetch or display questions before starting.
 */
export async function getScreeningQuestions(version = 'adventist') {
  const qs = getScreeningQs(version)
  return qs.map(q => ({ id: q.id, giftId: q.giftId, text: q.text, phase: q.phase }))
}

/**
 * Submit Phase 1 responses — score anchors, select candidates, return deep questions.
 *
 * @param {{ sessionToken: string, responses: Array<{questionId: string, score: number}> }} params
 */
export async function submitPhase1({ sessionToken, responses }) {
  const assessment = await GiftAssessment.findOne({ sessionToken })
  if (!assessment) throw new NotFoundError('Assessment not found')
  if (assessment.phase !== 'screening') {
    throw new ValidationError('Assessment is not in the screening phase')
  }

  const { gifts, questions } = resolveVersion(assessment.version)

  // Build normalised phase1Responses with giftId from questions
  const questionMap = new Map(questions.map(q => [q.id, q]))
  const phase1Responses = responses.map(r => {
    const q = questionMap.get(r.questionId)
    return { questionId: r.questionId, giftId: q?.giftId ?? '', score: r.score }
  })

  // Score Phase 1
  const phase1Scores = scorePhase1(responses, questions)

  // Select candidate gifts for Phase 2
  const phase2Candidates = getPhase2Candidates(phase1Scores)

  // Get deep questions for those candidates
  const deepQs = getDeepQuestionsForGifts(phase2Candidates, assessment.version)

  // Persist progress
  assessment.phase1Responses = phase1Responses
  assessment.phase2Candidates = phase2Candidates
  assessment.phase = 'deep'
  await assessment.save()

  return {
    phase1Scores,
    candidateGiftIds: phase2Candidates,
    deepQuestions: deepQs.map(q => ({
      id: q.id,
      giftId: q.giftId,
      text: q.text,
      reverse: q.reverse,
      phase: q.phase,
    })),
    transitionScreen: {
      topGiftIds: phase2Candidates,
    },
  }
}

/**
 * Submit Phase 2 responses — score deep questions, combine with Phase 1, persist final result.
 *
 * @param {{ sessionToken: string, responses: Array<{questionId: string, score: number}> }} params
 */
export async function submitPhase2({ sessionToken, responses }) {
  const assessment = await GiftAssessment.findOne({ sessionToken })
  if (!assessment) throw new NotFoundError('Assessment not found')
  if (assessment.phase !== 'deep') {
    throw new ValidationError('Assessment is not in the deep phase')
  }

  const { gifts, questions } = resolveVersion(assessment.version)

  // Build normalised phase2Responses with giftId
  const questionMap = new Map(questions.map(q => [q.id, q]))
  const phase2Responses = responses.map(r => {
    const q = questionMap.get(r.questionId)
    return { questionId: r.questionId, giftId: q?.giftId ?? '', score: r.score }
  })

  // Score Phase 2 (with reverse scoring applied)
  const phase2Scores = scorePhase2(responses, questions)

  // Re-derive Phase 1 scores from saved responses
  const phase1Scores = scorePhase1(
    assessment.phase1Responses.map(r => ({ questionId: r.questionId, score: r.score })),
    questions,
  )

  // Combine into final scores for all gifts
  const allGiftIds = gifts.map(g => g.id)
  const finalScores = scoreFinal(phase1Scores, phase2Scores, allGiftIds)

  // Top 3 gifts
  const top = getTopGifts(finalScores, 3)

  // Ministry recommendations
  const ministryMap = assessment.version === 'adventist'
    ? adventistGiftMap
    : Object.fromEntries(gifts.map(g => [g.id, { ministryAreas: g.ministryAreas }]))
  const recommendations = getMinistryRecommendations(top, ministryMap)

  // Build legacy scores shape for formatResult compatibility
  const legacyScores = finalScores.map(s => ({
    giftId: s.giftId,
    totalScore: s.anchorScore,   // approximate — primary scores are finalScore
    averageScore: s.finalScore,
    rank: s.rank,
    finalScore: s.finalScore,
    confidence: s.confidence,
    deepScore: s.deepScore,
    anchorScore: s.anchorScore,
  }))

  // Persist
  assessment.phase2Responses = phase2Responses
  assessment.scores = legacyScores
  assessment.primaryGift = top[0]?.giftId ?? null
  assessment.secondaryGift = top[1]?.giftId ?? null
  assessment.tertiaryGift = top[2]?.giftId ?? null
  assessment.ministryRecommendations = recommendations
  assessment.phase = 'complete'
  assessment.completedAt = new Date()
  assessment.expiresAt = null  // clear TTL — completed assessments are never auto-deleted
  await assessment.save()

  return formatResult(assessment, gifts)
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Format an assessment into a rich result object */
function formatResult(assessment, gifts) {
  const giftLookup = new Map(gifts.map(g => [g.id, g]))

  // Enrich scores with gift metadata
  let enrichedScores = assessment.scores.map(s => ({
    ...s,
    name: giftLookup.get(s.giftId)?.name ?? s.giftId,
    description: giftLookup.get(s.giftId)?.description ?? '',
    scripture: giftLookup.get(s.giftId)?.scripture ?? [],
  }))

  // Add SDA context for adventist version
  if (assessment.version === 'adventist') {
    enrichedScores = enrichWithAdventistContext(enrichedScores)
  }

  return {
    sessionToken: assessment.sessionToken,
    firstName: assessment.firstName,
    lastName: assessment.lastName,
    email: assessment.email,
    version: assessment.version,
    churchCode: assessment.churchCode,
    completedAt: assessment.completedAt,
    primaryGift: assessment.primaryGift,
    secondaryGift: assessment.secondaryGift,
    tertiaryGift: assessment.tertiaryGift,
    ministryRecommendations: assessment.ministryRecommendations,
    scores: enrichedScores,
  }
}
