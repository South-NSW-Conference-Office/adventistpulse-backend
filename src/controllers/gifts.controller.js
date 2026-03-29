/**
 * Gifts Assessment Controller
 *
 * Thin HTTP adapter — validates auth/body (via middleware), calls service,
 * returns standardised JSON responses. No business logic lives here.
 *
 * Mounted at /api/v1/gifts via gifts.routes.js
 */

import { response } from '../core/response.js'
import { asyncHandler } from './base.controller.js'
import { ForbiddenError } from '../core/errors/index.js'
import {
  startAssessment,
  submitResponses,
  getResult,
  getResultPublic,
  claimAssessment,
  getMyAssessments,
  getChurchGiftProfile,
  getScreeningQuestions,
  submitPhase1,
  submitPhase2,
} from '../services/gifts.service.js'

export const giftsController = {

  /** POST /api/v1/gifts/start — begin a new assessment */
  start: asyncHandler(async (req, res) => {
    const result = await startAssessment({
      ...req.body,
      userId: req.user?._id ?? null,  // authMiddleware sets req.user as Mongoose doc; use _id not .sub
    })
    response.created(res, result)
  }),

  /** POST /api/v1/gifts/submit — submit all responses and get scored result */
  submit: asyncHandler(async (req, res) => {
    const result = await submitResponses(req.body)
    response.success(res, result)
  }),

  /** GET /api/v1/gifts/result/:token — get result by session token (public).
   *  Email is redacted — token may be shared via QR/link to display results.
   */
  result: asyncHandler(async (req, res) => {
    const result = await getResultPublic(req.params.token)
    response.success(res, result)
  }),

  /** POST /api/v1/gifts/claim/:token — claim anonymous result (auth required) */
  claim: asyncHandler(async (req, res) => {
    const result = await claimAssessment({
      sessionToken: req.params.token,
      userId: req.user._id,  // auth required — _id is always present
    })
    response.success(res, result)
  }),

  /** GET /api/v1/gifts/my-assessments — list logged-in user's assessments */
  myAssessments: asyncHandler(async (req, res) => {
    const assessments = await getMyAssessments(req.user._id)
    response.success(res, assessments)
  }),

  /** GET /api/v1/gifts/church/:code/profile — church gift profile (pastor/admin).
   *  Access-gated: requester must have assignedChurches, delegatedAccess, or admin/editor role.
   */
  churchProfile: asyncHandler(async (req, res) => {
    const churchCode = req.params.code.toUpperCase()
    const user = req.user

    const hasAccess = user.assignedChurches?.includes(churchCode)
      || user.delegatedAccess?.some(d => d.churchCode === churchCode)
      || user.role === 'admin'
      || user.role === 'editor'

    if (!hasAccess) throw new ForbiddenError('You do not have access to this church')

    const profile = await getChurchGiftProfile(churchCode)
    response.success(res, profile)
  }),

  /** GET /api/v1/gifts/screening-questions — return Phase 1 anchor questions */
  screeningQuestions: asyncHandler(async (req, res) => {
    const version = req.query.version ?? 'adventist'
    const questions = await getScreeningQuestions(version)
    response.success(res, { questions })
  }),

  /** POST /api/v1/gifts/submit-phase1 — submit Phase 1 responses, get deep questions */
  submitPhase1: asyncHandler(async (req, res) => {
    const result = await submitPhase1(req.body)
    response.success(res, result)
  }),

  /** POST /api/v1/gifts/submit-phase2 — submit Phase 2 responses, get final result */
  submitPhase2: asyncHandler(async (req, res) => {
    const result = await submitPhase2(req.body)
    response.success(res, result)
  }),
}
