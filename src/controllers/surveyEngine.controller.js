/**
 * Survey Engine Controller
 *
 * Thin HTTP adapter — validates auth/body (via middleware), calls service,
 * returns standardised JSON responses. No business logic lives here.
 *
 * Mounted at /api/v1/survey-engine via surveyEngine.routes.js
 */

import { response } from '../core/response.js'
import { asyncHandler } from './base.controller.js'
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

export const surveyEngineController = {

  // ── Survey CRUD ─────────────────────────────────────────────────────────────

  /** POST /api/v1/survey-engine — create a new survey */
  create: asyncHandler(async (req, res) => {
    const survey = await createSurvey(req.body, req.user)
    response.created(res, survey)
  }),

  /** GET /api/v1/survey-engine — list my surveys */
  list: asyncHandler(async (req, res) => {
    const surveys = await listSurveys(req.user)
    response.success(res, surveys)
  }),

  /** GET /api/v1/survey-engine/:id — get a single survey */
  get: asyncHandler(async (req, res) => {
    const survey = await getSurvey(req.params.id, req.user)
    response.success(res, survey)
  }),

  /** PATCH /api/v1/survey-engine/:id — update a draft survey */
  update: asyncHandler(async (req, res) => {
    const survey = await updateSurvey(req.params.id, req.body, req.user)
    response.success(res, survey)
  }),

  /** DELETE /api/v1/survey-engine/:id — delete a draft survey */
  delete: asyncHandler(async (req, res) => {
    await deleteSurvey(req.params.id, req.user)
    response.success(res, null)
  }),

  // ── Publish & Lifecycle ──────────────────────────────────────────────────────

  /** POST /api/v1/survey-engine/:id/publish — publish with targeting */
  publish: asyncHandler(async (req, res) => {
    const result = await publishSurvey(req.params.id, req.body, req.user)
    response.success(res, result)
  }),

  /** POST /api/v1/survey-engine/:id/close — close a survey */
  close: asyncHandler(async (req, res) => {
    const survey = await closeSurvey(req.params.id, req.user)
    response.success(res, survey)
  }),

  // ── Results ──────────────────────────────────────────────────────────────────

  /** GET /api/v1/survey-engine/:id/results — aggregate results */
  results: asyncHandler(async (req, res) => {
    const results = await getSurveyResults(req.params.id, req.user)
    response.success(res, results)
  }),

  // ── AI Assistance ────────────────────────────────────────────────────────────

  /** POST /api/v1/survey-engine/ai/generate — generate questions from intent */
  aiGenerate: asyncHandler(async (req, res) => {
    const questions = await generateSurveyQuestions(req.body.intent, req.body.questionCount)
    response.success(res, { questions })
  }),

  /** POST /api/v1/survey-engine/ai/review — review a single question for quality */
  aiReview: asyncHandler(async (req, res) => {
    const review = await reviewSurveyQuestion(req.body.question, req.body.type)
    response.success(res, review)
  }),

  // ── Public: Submit Response ──────────────────────────────────────────────────

  /** POST /api/v1/survey-engine/respond — submit a response (no auth required) */
  respond: asyncHandler(async (req, res) => {
    const result = await submitEngineResponse(req.body)
    response.created(res, result)
  }),
}
