import { Router } from 'express'
import { asyncHandler } from '../lib/asyncHandler.js'
import { validate } from '../middleware/validate.middleware.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requirePasswordChanged } from '../middleware/requirePasswordChanged.middleware.js'
import { requireApproved } from '../middleware/requireApproved.middleware.js'
import {
  createSurveySchema,
  publishSurveySchema,
  aiGenerateSchema,
  aiReviewSchema,
  submitEngineResponseSchema,
} from '../validators/surveyEngine.validator.js'
import {
  createSurvey,
  listSurveys,
  getSurvey,
  updateSurvey,
  deleteSurvey,
  publishSurvey,
  closeSurvey,
  submitEngineResponse,
  getSurveyResults,
} from '../services/surveyEngine.service.js'
import { generateSurveyQuestions, reviewSurveyQuestion } from '../services/surveyAI.service.js'

const router = Router()

/** Auth stack for all write/read operations */
const auth = [authMiddleware, requirePasswordChanged, requireApproved]

// ── Survey CRUD ───────────────────────────────────────────────────────────────

/** POST /api/v1/survey-engine — create a new survey */
router.post('/', auth, validate(createSurveySchema), asyncHandler(async (req, res) => {
  const survey = await createSurvey(req.body, req.user)
  res.status(201).json({ success: true, data: survey })
}))

/** GET /api/v1/survey-engine — list my surveys */
router.get('/', auth, asyncHandler(async (req, res) => {
  const surveys = await listSurveys(req.user)
  res.json({ success: true, data: surveys })
}))

/** GET /api/v1/survey-engine/:id — get a survey */
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const survey = await getSurvey(req.params.id, req.user)
  res.json({ success: true, data: survey })
}))

/** PATCH /api/v1/survey-engine/:id — update a draft survey */
router.patch('/:id', auth, validate(createSurveySchema.partial()), asyncHandler(async (req, res) => {
  const survey = await updateSurvey(req.params.id, req.body, req.user)
  res.json({ success: true, data: survey })
}))

/** DELETE /api/v1/survey-engine/:id — delete a draft survey */
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  await deleteSurvey(req.params.id, req.user)
  res.json({ success: true })
}))

// ── Publish & Lifecycle ───────────────────────────────────────────────────────

/** POST /api/v1/survey-engine/:id/publish — publish with targeting */
router.post('/:id/publish', auth, validate(publishSurveySchema), asyncHandler(async (req, res) => {
  const result = await publishSurvey(req.params.id, req.body, req.user)
  res.json({ success: true, data: result })
}))

/** POST /api/v1/survey-engine/:id/close — close a survey */
router.post('/:id/close', auth, asyncHandler(async (req, res) => {
  const survey = await closeSurvey(req.params.id, req.user)
  res.json({ success: true, data: survey })
}))

// ── Results ───────────────────────────────────────────────────────────────────

/** GET /api/v1/survey-engine/:id/results — aggregate results */
router.get('/:id/results', auth, asyncHandler(async (req, res) => {
  const results = await getSurveyResults(req.params.id, req.user)
  res.json({ success: true, data: results })
}))

// ── AI Assistance ─────────────────────────────────────────────────────────────

/** POST /api/v1/survey-engine/ai/generate — generate questions from intent */
router.post('/ai/generate', auth, validate(aiGenerateSchema), asyncHandler(async (req, res) => {
  const questions = await generateSurveyQuestions(req.body.intent, req.body.questionCount)
  res.json({ success: true, data: { questions } })
}))

/** POST /api/v1/survey-engine/ai/review — review a single question for quality */
router.post('/ai/review', auth, validate(aiReviewSchema), asyncHandler(async (req, res) => {
  const review = await reviewSurveyQuestion(req.body.question, req.body.type)
  res.json({ success: true, data: review })
}))

// ── Public: Submit Response ───────────────────────────────────────────────────

/** POST /api/v1/survey-engine/respond — submit a response (no auth required) */
router.post('/respond', validate(submitEngineResponseSchema), asyncHandler(async (req, res) => {
  const result = await submitEngineResponse(req.body)
  res.status(201).json({ success: true, data: result })
}))

export default router
