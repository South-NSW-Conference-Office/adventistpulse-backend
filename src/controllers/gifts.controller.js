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
import {
  startAssessment,
  submitResponses,
  getResult,
  claimAssessment,
  getMyAssessments,
  getChurchGiftProfile,
} from '../services/gifts.service.js'

export const giftsController = {

  /** POST /api/v1/gifts/start — begin a new assessment */
  start: asyncHandler(async (req, res) => {
    const result = await startAssessment({
      ...req.body,
      userId: req.user?._id ?? null,
    })
    response.created(res, result)
  }),

  /** POST /api/v1/gifts/submit — submit all responses and get scored result */
  submit: asyncHandler(async (req, res) => {
    const result = await submitResponses(req.body)
    response.success(res, result)
  }),

  /** GET /api/v1/gifts/result/:token — get result by session token (public) */
  result: asyncHandler(async (req, res) => {
    const result = await getResult(req.params.token)
    response.success(res, result)
  }),

  /** POST /api/v1/gifts/claim/:token — claim anonymous result (auth required) */
  claim: asyncHandler(async (req, res) => {
    const result = await claimAssessment({
      sessionToken: req.params.token,
      userId: req.user._id,
    })
    response.success(res, result)
  }),

  /** GET /api/v1/gifts/my-assessments — list logged-in user's assessments */
  myAssessments: asyncHandler(async (req, res) => {
    const assessments = await getMyAssessments(req.user._id)
    response.success(res, assessments)
  }),

  /** GET /api/v1/gifts/church/:code/profile — church gift profile (pastor/admin) */
  churchProfile: asyncHandler(async (req, res) => {
    const profile = await getChurchGiftProfile(req.params.code)
    response.success(res, profile)
  }),
}
