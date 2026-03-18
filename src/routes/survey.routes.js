/**
 * Survey Routes
 *
 * Two separate router exports:
 *   pastorSurveyRoutes — mounted at /api/v1/pastor/survey  (auth required)
 *   publicSurveyRoutes — mounted at /api/v1/survey         (public, rate-limited)
 *
 * Endpoints:
 *   POST   /v1/pastor/survey/sessions           — create session (pastor|elder|admin)
 *   GET    /v1/pastor/survey/sessions           — list sessions  (pastor|elder|admin)
 *   GET    /v1/pastor/survey/sessions/:id/results — live results (creator or same conference)
 *   PATCH  /v1/pastor/survey/sessions/:id/close  — close session (creator or same conference)
 *   GET    /v1/survey/sessions/:code            — public session info
 *   POST   /v1/survey/sessions/:code/respond    — submit response (rate-limited)
 */

import { Router }                  from 'express'
import { authMiddleware }          from '../middleware/auth.middleware.js'
import { requirePasswordChanged }  from '../middleware/requirePasswordChanged.middleware.js'
import { requireRole }             from '../middleware/role.middleware.js'
import { requireApproved }         from '../middleware/requireApproved.middleware.js'
import { validate }                from '../middleware/validate.middleware.js'
import { surveyRespondRateLimit }  from '../middleware/rateLimit.middleware.js'
import { asyncHandler }            from '../controllers/base.controller.js'
import { response }                from '../core/response.js'
import { surveyService }           from '../services/survey.service.js'
import {
  createSessionSchema,
  submitResponseSchema,
  listSessionsSchema,
} from '../validators/survey.validator.js'

// ─── Auth middleware stack for pastor routes ───────────────────────────────────
const pastorAuth = [authMiddleware, requirePasswordChanged, requireApproved, requireRole('elder')]

// ─── Pastor router (authenticated) ────────────────────────────────────────────
export const pastorSurveyRoutes = Router()

// POST /v1/pastor/survey/sessions — create new survey session
pastorSurveyRoutes.post(
  '/sessions',
  ...pastorAuth,
  validate(createSessionSchema),
  asyncHandler(async (req, res) => {
    const conferenceCode = req.user.subscription?.conferenceCode
    if (!conferenceCode) {
      return response.error(res, {
        statusCode: 403,
        code: 'NO_CONFERENCE_ASSIGNED',
        message: 'Your account is not assigned to a conference.',
        isOperational: true,
      })
    }

    const data = await surveyService.createSession(req.user._id, conferenceCode, req.body)
    response.created(res, data)
  })
)

// GET /v1/pastor/survey/sessions — list sessions for conference
pastorSurveyRoutes.get(
  '/sessions',
  ...pastorAuth,
  validate(listSessionsSchema, 'query'),
  asyncHandler(async (req, res) => {
    const conferenceCode = req.user.subscription?.conferenceCode
    if (!conferenceCode) {
      return response.error(res, {
        statusCode: 403,
        code: 'NO_CONFERENCE_ASSIGNED',
        message: 'Your account is not assigned to a conference.',
        isOperational: true,
      })
    }

    const { data, total, page, limit } = await surveyService.listSessions(conferenceCode, req.query)
    response.paginated(res, data, { total, page, limit })
  })
)

// GET /v1/pastor/survey/sessions/:id/results — live aggregated results
pastorSurveyRoutes.get(
  '/sessions/:id/results',
  ...pastorAuth,
  asyncHandler(async (req, res) => {
    const data = await surveyService.getResults(
      req.params.id,
      req.user._id,
      req.user.subscription?.conferenceCode
    )
    response.success(res, data)
  })
)

// PATCH /v1/pastor/survey/sessions/:id/close — close an active session
pastorSurveyRoutes.patch(
  '/sessions/:id/close',
  ...pastorAuth,
  asyncHandler(async (req, res) => {
    const data = await surveyService.closeSession(
      req.params.id,
      req.user._id,
      req.user.subscription?.conferenceCode
    )
    response.success(res, data)
  })
)

// ─── Public router (no auth) ───────────────────────────────────────────────────
export const publicSurveyRoutes = Router()

// GET /v1/survey/sessions/:code — validate session before responding
publicSurveyRoutes.get(
  '/sessions/:code',
  asyncHandler(async (req, res) => {
    const data = await surveyService.getSessionPublic(req.params.code)
    response.success(res, data)
  })
)

// POST /v1/survey/sessions/:code/respond — submit response (rate-limited)
publicSurveyRoutes.post(
  '/sessions/:code/respond',
  surveyRespondRateLimit,
  validate(submitResponseSchema),
  asyncHandler(async (req, res) => {
    const data = await surveyService.respond(req.params.code, req.body)
    response.created(res, data)
  })
)
