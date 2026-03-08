import { onboardingService } from '../services/onboarding.service.js'
import { response }          from '../core/response.js'
import { asyncHandler }      from './base.controller.js'

export const onboardingController = {
  getStatus: asyncHandler(async (req, res) => {
    const status = await onboardingService.getStatus(req.user.sub)
    response.success(res, status)
  }),

  submit: asyncHandler(async (req, res) => {
    const result = await onboardingService.submit(req.user.sub, req.body)
    response.success(res, result)
  }),
}
