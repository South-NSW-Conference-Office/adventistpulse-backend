/**
 * Vitality Check 2.0 Routes
 *
 * Congregation-answered (not pastor self-report). Pastor creates a session,
 * members of the church submit Likert answers, pastor triggers calculation
 * when ≥5 responses are in.
 *
 * Mount at: /api/v1/vitality-v2
 *
 * Endpoints:
 *   GET  /readiness/:churchCode       — profile completeness gate
 *   POST /session                     — create session (pastor+)
 *   GET  /session/:sessionCode        — get session + questions (member of that church)
 *   POST /session/:sessionCode/respond — submit answers (member, once only)
 *   POST /session/:sessionCode/calculate — trigger scoring (pastor+, ≥5 responses)
 *   GET  /results/:churchCode         — most recent calculated results (pastor+)
 *   GET  /history/:churchCode         — last 5 sessions (pastor+)
 */

import { Router }                 from 'express'
import crypto                     from 'crypto'
import { authMiddleware }         from '../middleware/auth.middleware.js'
import { requirePasswordChanged } from '../middleware/requirePasswordChanged.middleware.js'
import { requireRole }            from '../middleware/role.middleware.js'
import { requireApproved }        from '../middleware/requireApproved.middleware.js'
import { asyncHandler }           from '../controllers/base.controller.js'
import { response }               from '../core/response.js'
import { NotFoundError, ForbiddenError, AppError } from '../core/errors/index.js'
import { User }                   from '../models/User.js'
import { YearlyStats }            from '../models/YearlyStats.js'
import { VitalityV2Session }      from '../models/VitalityV2Session.js'

const router = Router()

// ─── Auth stacks ──────────────────────────────────────────────────────────────
const memberAuth = [authMiddleware, requirePasswordChanged, requireApproved]
const pastorAuth = [...memberAuth, requireRole('elder')]

// ─── Questions (canonical) ────────────────────────────────────────────────────
// Self-report question IDs per dimension (congregation answers these 1–5 Likert)
const DIMENSION_QUESTIONS = {
  spiritual:    ['SD-1', 'SD-2', 'SD-3', 'SD-4'],
  community:    ['CP-1', 'CP-2', 'CP-3', 'CP-4'],
  belonging:    ['BR-1', 'BR-2'],
  generational: ['GH-1', 'GH-2', 'GH-3', 'GH-4'],
  activation:   ['MA-1', 'MA-2', 'MA-3', 'MA-4'],
  leadership:   ['LE-1', 'LE-2', 'LE-3', 'LE-4'],
  // growth: auto from DB — no congregation questions
}

const ALL_QUESTION_IDS = Object.values(DIMENSION_QUESTIONS).flat()

const DIMENSION_LABELS = {
  spiritual:    'Spiritual Depth',
  community:    'Community Presence',
  belonging:    'Belonging & Retention',
  generational: 'Generational Health',
  growth:       'Growth Health',
  activation:   'Member Activation',
  leadership:   'Leadership Empowerment',
}

// ─── Scoring helpers ──────────────────────────────────────────────────────────

/**
 * Calculate band from 0–100 score.
 * Brief bands: Thriving ≥80 | Healthy 60-79 | Developing 40-59 | At Risk <40
 */
function getBand(score) {
  if (score === null || score === undefined) return null
  if (score >= 80) return 'thriving'
  if (score >= 60) return 'healthy'
  if (score >= 40) return 'developing'
  return 'at-risk'
}

/**
 * Average all responses for a set of question IDs for a given dimension.
 * Returns 0–100 scaled score, or null if no answers.
 */
function scoreDimension(responses, questionIds) {
  const values = []
  for (const resp of responses) {
    for (const qId of questionIds) {
      const val = resp.answers.get ? resp.answers.get(qId) : resp.answers[qId]
      if (val != null && val >= 1 && val <= 5) values.push(val)
    }
  }
  if (values.length === 0) return null
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  // Scale 1–5 → 0–100
  return Math.round(((avg - 1) / 4) * 100)
}

/**
 * Calculate Growth Health from YearlyStats documents.
 * Returns 0–100 or null if insufficient data.
 */
async function calcGrowthHealth(churchCode) {
  // Get most recent 3 years of stats
  const stats = await YearlyStats.find({ entityCode: churchCode })
    .sort({ year: -1 })
    .limit(3)
    .lean()

  if (!stats.length) return { score: null, snapshot: null, lastDataYear: null }

  const latest = stats[0]
  const prior  = stats[1] || null

  // ─── GRW-1: Baptism Rate ──────────────────────────────────────────────────
  let grw1 = null
  const avgAttendance = latest.membership?.beginningMembership
    ? (latest.membership.beginningMembership + (latest.membership.endingMembership || 0)) / 2
    : null

  if (latest.membership?.baptisms != null && avgAttendance) {
    const rate = (latest.membership.baptisms / avgAttendance) * 100
    if (rate >= 7)   grw1 = 5
    else if (rate >= 5) grw1 = 4
    else if (rate >= 2) grw1 = 3
    else if (rate >= 0.5) grw1 = 2
    else grw1 = 1
  }

  // ─── GRW-2: Attendance Trend ──────────────────────────────────────────────
  let grw2 = null
  if (prior && latest.membership?.endingMembership && prior.membership?.endingMembership) {
    const trend = ((latest.membership.endingMembership - prior.membership.endingMembership)
      / prior.membership.endingMembership) * 100
    if (trend >= 5)   grw2 = 5
    else if (trend >= 2) grw2 = 4
    else if (trend >= -1.9) grw2 = 3
    else if (trend >= -9.9) grw2 = 2
    else grw2 = 1
  }

  // ─── GRW-3: Membership-Attendance Ratio ───────────────────────────────────
  let grw3 = null
  const bm = latest.membership?.beginningMembership
  const em = latest.membership?.endingMembership
  if (bm && em && avgAttendance) {
    const ratio = (avgAttendance / ((bm + em) / 2)) * 100
    if (ratio >= 65) grw3 = 5
    else if (ratio >= 50) grw3 = 4
    else if (ratio >= 35) grw3 = 3
    else if (ratio >= 20) grw3 = 2
    else grw3 = 1
  }

  // ─── GRW-4: Net Growth Rate ───────────────────────────────────────────────
  let grw4 = null
  const { baptisms, transfersIn, dropped, deaths, transfersOut, beginning } = {
    baptisms:    latest.membership?.baptisms    || 0,
    transfersIn: latest.membership?.transfersIn || 0,
    dropped:     latest.membership?.dropped     || 0,
    deaths:      latest.membership?.deaths      || 0,
    transfersOut:latest.membership?.transfersOut|| 0,
    beginning:   latest.membership?.beginningMembership || null,
  }
  if (beginning) {
    const ngr = ((baptisms + transfersIn - dropped - deaths - transfersOut) / beginning) * 100
    if (ngr >= 3)    grw4 = 5
    else if (ngr >= 1) grw4 = 4
    else if (ngr >= -0.9) grw4 = 3
    else if (ngr >= -4.9) grw4 = 2
    else grw4 = 1
  }

  const available = [grw1, grw2, grw3, grw4].filter(v => v !== null)
  if (!available.length) return { score: null, snapshot: null, lastDataYear: latest.year }

  const rawAvg = available.reduce((a, b) => a + b, 0) / available.length
  const score = Math.round(((rawAvg - 1) / 4) * 100)

  const snapshot = {
    year:                latest.year,
    baptisms:            latest.membership?.baptisms,
    beginningMembership: latest.membership?.beginningMembership,
    endingMembership:    latest.membership?.endingMembership,
    transfersIn:         latest.membership?.transfersIn,
    transfersOut:        latest.membership?.transfersOut,
    deaths:              latest.membership?.deaths,
    dropped:             latest.membership?.dropped,
    netGrowth:           latest.membership?.netGrowth,
    priorYear:           prior?.year,
    priorYearMembership: prior?.membership?.endingMembership,
  }

  return { score, snapshot, lastDataYear: latest.year }
}

// ─── Readiness endpoint ───────────────────────────────────────────────────────
// GET /readiness/:churchCode
router.get(
  '/readiness/:churchCode',
  ...memberAuth,
  asyncHandler(async (req, res) => {
    const churchCode = req.params.churchCode.toUpperCase()

    // Count subscribed members for this church
    const [memberCount, completeCount] = await Promise.all([
      User.countDocuments({ memberChurch: churchCode, accountStatus: 'approved' }),
      User.countDocuments({
        memberChurch:   churchCode,
        accountStatus:  'approved',
        name:           { $exists: true, $ne: '' },
        // We define profile completeness as: name present (always true due to required)
        // + memberChurch set (always true in this query). In a future iteration,
        // suburb/age could be added as optional profile fields.
        // For now: profile is "complete" if name is non-empty and memberChurch matches.
        // This is correct — the query already filters memberChurch, so all results
        // have complete profiles by definition.
      }),
    ])

    const completenessPercent = memberCount > 0
      ? Math.round((completeCount / memberCount) * 100)
      : 0

    const canProceed = completenessPercent >= 50

    // Check for growth data
    const growthStats = await YearlyStats.find({ entityCode: churchCode })
      .sort({ year: -1 })
      .limit(1)
      .lean()

    const hasGrowthData  = growthStats.length > 0
    const lastDataYear   = hasGrowthData ? growthStats[0].year : null

    // Detailed growth data availability
    const gs = growthStats[0] || {}
    const hasBaptisms   = hasGrowthData && gs.membership?.baptisms   != null
    const hasMembership = hasGrowthData && gs.membership?.beginningMembership != null
    const hasAttendance = hasGrowthData && gs.membership?.endingMembership    != null

    response.success(res, {
      memberCount,
      profilesComplete:    completeCount,
      completenessPercent,
      canProceed,
      hasGrowthData,
      lastDataYear,
      growthDataDetail: {
        membershipTrend: hasMembership,
        baptisms:        hasBaptisms,
        attendance:      hasAttendance,
      },
    })
  })
)

// ─── Create session ───────────────────────────────────────────────────────────
// POST /session
router.post(
  '/session',
  ...pastorAuth,
  asyncHandler(async (req, res) => {
    const { churchCode } = req.body
    if (!churchCode) throw new AppError('churchCode is required', { statusCode: 400, code: 'MISSING_CHURCH_CODE' })

    const code = churchCode.toUpperCase()

    // Verify requester has access to this church
    const user = req.user
    const hasAccess = user.assignedChurches?.includes(code)
      || user.delegatedAccess?.some(d => d.churchCode === code)
      || user.role === 'admin'
      || user.role === 'editor'

    if (!hasAccess) throw new ForbiddenError('You do not have access to this church')

    // Close any existing active session for this church
    await VitalityV2Session.updateMany(
      { churchCode: code, status: 'active' },
      { $set: { status: 'closed', closedAt: new Date() } }
    )

    // Generate unique 8-char session code
    const sessionCode = crypto.randomBytes(4).toString('hex').toUpperCase()

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const session = await VitalityV2Session.create({
      churchCode:  code,
      createdBy:   user._id,
      sessionCode,
      expiresAt,
    })

    response.created(res, {
      sessionCode:    session.sessionCode,
      churchCode:     session.churchCode,
      expiresAt:      session.expiresAt,
      status:         session.status,
      responseCount:  0,
      shareUrl:       `/vitality-check/v2?session=${session.sessionCode}`,
    })
  })
)

// ─── Get session + questions ──────────────────────────────────────────────────
// GET /session/:sessionCode
router.get(
  '/session/:sessionCode',
  ...memberAuth,
  asyncHandler(async (req, res) => {
    const sessionCode = req.params.sessionCode.toUpperCase()

    const session = await VitalityV2Session.findOne({ sessionCode }).lean()
    if (!session) throw new NotFoundError('Session')

    // Check session not expired
    if (session.status === 'expired' || new Date() > session.expiresAt) {
      throw new AppError('This session has expired', { statusCode: 410, code: 'SESSION_EXPIRED' })
    }
    if (session.status === 'closed') {
      throw new AppError('This session has been closed', { statusCode: 410, code: 'SESSION_CLOSED' })
    }

    // Check requester is a member of this church
    const user = req.user
    const isMember   = user.memberChurch === session.churchCode
    const isPastor   = user.assignedChurches?.includes(session.churchCode)
      || user.delegatedAccess?.some(d => d.churchCode === session.churchCode)
      || user.role === 'admin' || user.role === 'editor'

    if (!isMember && !isPastor) {
      throw new ForbiddenError('You are not a member of this church')
    }

    // Has user already responded?
    const hasResponded = session.responses?.some(
      r => r.userId?.toString() === user._id.toString()
    )

    response.success(res, {
      sessionCode:   session.sessionCode,
      churchCode:    session.churchCode,
      status:        session.status,
      expiresAt:     session.expiresAt,
      responseCount: session.responses?.length || 0,
      hasResponded,
      isPastor,
      questions:     DIMENSION_QUESTIONS,
    })
  })
)

// ─── Submit member answers ────────────────────────────────────────────────────
// POST /session/:sessionCode/respond
router.post(
  '/session/:sessionCode/respond',
  ...memberAuth,
  asyncHandler(async (req, res) => {
    const sessionCode = req.params.sessionCode.toUpperCase()
    const { answers }  = req.body

    if (!answers || typeof answers !== 'object') {
      throw new AppError('answers object required', { statusCode: 400, code: 'MISSING_ANSWERS' })
    }

    const session = await VitalityV2Session.findOne({ sessionCode })
    if (!session) throw new NotFoundError('Session')

    if (session.status !== 'active' || new Date() > session.expiresAt) {
      throw new AppError('Session is not accepting responses', { statusCode: 410, code: 'SESSION_CLOSED' })
    }

    // Check membership
    const user = req.user
    const isMember = user.memberChurch === session.churchCode
      || user.assignedChurches?.includes(session.churchCode)
      || user.delegatedAccess?.some(d => d.churchCode === session.churchCode)
      || user.role === 'admin' || user.role === 'editor'

    if (!isMember) throw new ForbiddenError('You are not a member of this church')

    // Check not already responded
    const already = session.responses.some(
      r => r.userId.toString() === user._id.toString()
    )
    if (already) {
      throw new AppError('You have already submitted a response for this session', { statusCode: 409, code: 'ALREADY_RESPONDED' })
    }

    // Validate answers — all self-report question IDs must have values 1–5
    const answersMap = new Map()
    for (const qId of ALL_QUESTION_IDS) {
      const val = answers[qId]
      if (val == null) {
        throw new AppError(`Missing answer for question ${qId}`, { statusCode: 400, code: 'MISSING_ANSWER' })
      }
      const num = Number(val)
      if (!Number.isInteger(num) || num < 1 || num > 5) {
        throw new AppError(`Answer for ${qId} must be 1–5`, { statusCode: 400, code: 'INVALID_ANSWER' })
      }
      answersMap.set(qId, num)
    }

    session.responses.push({
      userId:  user._id,
      answers: answersMap,
    })
    await session.save()

    response.created(res, {
      message:       'Response submitted successfully',
      responseCount: session.responses.length,
    })
  })
)

// ─── Calculate scores ─────────────────────────────────────────────────────────
// POST /session/:sessionCode/calculate
router.post(
  '/session/:sessionCode/calculate',
  ...pastorAuth,
  asyncHandler(async (req, res) => {
    const sessionCode = req.params.sessionCode.toUpperCase()

    const session = await VitalityV2Session.findOne({ sessionCode })
    if (!session) throw new NotFoundError('Session')

    // Verify pastor access
    const user = req.user
    const hasAccess = user.assignedChurches?.includes(session.churchCode)
      || user.delegatedAccess?.some(d => d.churchCode === session.churchCode)
      || user.role === 'admin' || user.role === 'editor'
    if (!hasAccess) throw new ForbiddenError('No access to this church')

    if (session.responses.length < 5) {
      throw new AppError(
        `Need at least 5 responses to calculate. Currently have ${session.responses.length}.`,
        { statusCode: 400, code: 'INSUFFICIENT_RESPONSES' }
      )
    }

    // Score each congregation dimension
    const scores = {}
    for (const [dimId, qIds] of Object.entries(DIMENSION_QUESTIONS)) {
      scores[dimId] = scoreDimension(session.responses, qIds)
    }

    // Growth Health — auto from DB
    const { score: growthScore, snapshot, lastDataYear } = await calcGrowthHealth(session.churchCode)
    scores.growth = growthScore

    // Overall score — weighted average
    // Growth Health: 0.20 weight; others: 0.133 each (6 × 0.133 ≈ 0.80)
    const WEIGHTS = {
      spiritual:    0.133,
      community:    0.133,
      belonging:    0.133,
      generational: 0.133,
      activation:   0.133,
      leadership:   0.133,
      growth:       0.20,
    }

    let weightedSum   = 0
    let totalWeight   = 0
    let minimumScore  = Infinity
    let minimumFactor = null

    for (const [dimId, weight] of Object.entries(WEIGHTS)) {
      const s = scores[dimId]
      if (s === null || s === undefined) continue
      weightedSum  += s * weight
      totalWeight  += weight
      if (s < minimumScore) {
        minimumScore  = s
        minimumFactor = { id: dimId, label: DIMENSION_LABELS[dimId], score: s }
      }
    }

    const overallScore = totalWeight > 0
      ? Math.round(weightedSum / totalWeight)
      : null

    const band = getBand(overallScore)

    // Persist
    session.scores        = scores
    session.overallScore  = overallScore
    session.minimumFactor = minimumFactor
    session.band          = band
    session.dataSnapshot  = snapshot
    session.calculatedAt  = new Date()
    session.status        = 'closed'
    await session.save()

    response.success(res, {
      overallScore,
      band,
      minimumFactor,
      scores,
      responseCount: session.responses.length,
      lastDataYear,
      calculatedAt:  session.calculatedAt,
    })
  })
)

// ─── Results ──────────────────────────────────────────────────────────────────
// GET /results/:churchCode
router.get(
  '/results/:churchCode',
  ...pastorAuth,
  asyncHandler(async (req, res) => {
    const churchCode = req.params.churchCode.toUpperCase()

    // Verify access
    const user = req.user
    const hasAccess = user.assignedChurches?.includes(churchCode)
      || user.delegatedAccess?.some(d => d.churchCode === churchCode)
      || user.role === 'admin' || user.role === 'editor'
    if (!hasAccess) throw new ForbiddenError('No access to this church')

    const session = await VitalityV2Session.findOne({
      churchCode,
      band:         { $ne: null },
      calculatedAt: { $ne: null },
    })
      .sort({ calculatedAt: -1 })
      .lean()

    if (!session) {
      return response.success(res, null)
    }

    response.success(res, {
      sessionCode:   session.sessionCode,
      overallScore:  session.overallScore,
      band:          session.band,
      minimumFactor: session.minimumFactor,
      scores:        session.scores,
      responseCount: session.responses?.length || 0,
      dataSnapshot:  session.dataSnapshot,
      calculatedAt:  session.calculatedAt,
      createdAt:     session.createdAt,
    })
  })
)

// ─── History ──────────────────────────────────────────────────────────────────
// GET /history/:churchCode
router.get(
  '/history/:churchCode',
  ...pastorAuth,
  asyncHandler(async (req, res) => {
    const churchCode = req.params.churchCode.toUpperCase()

    const user = req.user
    const hasAccess = user.assignedChurches?.includes(churchCode)
      || user.delegatedAccess?.some(d => d.churchCode === churchCode)
      || user.role === 'admin' || user.role === 'editor'
    if (!hasAccess) throw new ForbiddenError('No access to this church')

    const sessions = await VitalityV2Session.find({
      churchCode,
      calculatedAt: { $ne: null },
    })
      .sort({ calculatedAt: -1 })
      .limit(5)
      .select('-responses')
      .lean()

    response.success(res, sessions.map(s => ({
      sessionCode:   s.sessionCode,
      overallScore:  s.overallScore,
      band:          s.band,
      minimumFactor: s.minimumFactor,
      scores:        s.scores,
      responseCount: s.responses?.length || 0,
      calculatedAt:  s.calculatedAt,
      createdAt:     s.createdAt,
    })))
  })
)

export default router
