import { Router } from 'express'
import { validate } from '../middleware/validate.middleware.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requirePasswordChanged } from '../middleware/requirePasswordChanged.middleware.js'
import { requireApproved } from '../middleware/requireApproved.middleware.js'
import { surveyEngineRespondRateLimit, aiUserRateLimit } from '../middleware/rateLimit.middleware.js'
import {
  createSurveySchema,
  publishSurveySchema,
  aiGenerateSchema,
  aiReviewSchema,
  submitEngineResponseSchema,
} from '../validators/surveyEngine.validator.js'
import { surveyEngineController } from '../controllers/surveyEngine.controller.js'

const router = Router()

/** Auth stack for all write/read operations */
const auth = [authMiddleware, requirePasswordChanged, requireApproved]

// ── Survey CRUD ───────────────────────────────────────────────────────────────

/** POST /api/v1/survey-engine — create a new survey */
router.post('/', auth, validate(createSurveySchema), surveyEngineController.create)

/** GET /api/v1/survey-engine — list my surveys */
router.get('/', auth, surveyEngineController.list)

/** GET /api/v1/survey-engine/:id — get a survey */
router.get('/:id', auth, surveyEngineController.get)

/** PATCH /api/v1/survey-engine/:id — update a draft survey */
router.patch('/:id', auth, validate(createSurveySchema.partial()), surveyEngineController.update)

/** DELETE /api/v1/survey-engine/:id — delete a draft survey */
router.delete('/:id', auth, surveyEngineController.delete)

// ── Publish & Lifecycle ───────────────────────────────────────────────────────

/** POST /api/v1/survey-engine/:id/publish — publish with targeting */
router.post('/:id/publish', auth, validate(publishSurveySchema), surveyEngineController.publish)

/** POST /api/v1/survey-engine/:id/close — close a survey */
router.post('/:id/close', auth, surveyEngineController.close)

// ── Results ───────────────────────────────────────────────────────────────────

/** GET /api/v1/survey-engine/:id/results — aggregate results */
router.get('/:id/results', auth, surveyEngineController.results)

// ── AI Assistance ─────────────────────────────────────────────────────────────

/** POST /api/v1/survey-engine/ai/generate — generate questions from intent */
router.post('/ai/generate', auth, aiUserRateLimit, validate(aiGenerateSchema), surveyEngineController.aiGenerate)

/** POST /api/v1/survey-engine/ai/review — review a single question for quality */
router.post('/ai/review', auth, aiUserRateLimit, validate(aiReviewSchema), surveyEngineController.aiReview)

// ── Public: Submit Response ───────────────────────────────────────────────────

/** POST /api/v1/survey-engine/respond — submit a response (no auth required) */
router.post('/respond', surveyEngineRespondRateLimit, validate(submitEngineResponseSchema), surveyEngineController.respond)

export default router
