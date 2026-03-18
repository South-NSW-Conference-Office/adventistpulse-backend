import { signalService }  from '../services/signal.service.js'
import { sweepAll }       from '../jobs/signal.job.js'
import { response }       from '../core/response.js'
import { asyncHandler }   from './base.controller.js'
import { ForbiddenError } from '../core/errors/index.js'

/**
 * Resolve the calling admin's conference code from their subscription.
 * Always pulled from req.user — never from request params or body.
 */
function getConference(req) {
  const code = req.user?.subscription?.conferenceCode
  if (!code) throw new ForbiddenError('No conference assigned to your account')
  return code.toUpperCase()
}

export const signalController = {

  /** GET /admin/signals — active signals for this conference */
  list: asyncHandler(async (req, res) => {
    const conferenceCode = getConference(req)
    const { tiers, resolved, limit } = req.query // already validated + transformed by middleware

    const [signals, counts] = await Promise.all([
      signalService.list(conferenceCode, { tiers, resolved, limit }),
      signalService.counts(conferenceCode),
    ])

    response.success(res, { signals, counts })
  }),

  /** GET /admin/signals/church/:code — signals for one church in this conference */
  forChurch: asyncHandler(async (req, res) => {
    const conferenceCode = getConference(req)
    const signals = await signalService.forChurch(req.params.code, conferenceCode)
    response.success(res, signals)
  }),

  /** PATCH /admin/signals/:id/resolve — mark a signal resolved */
  resolve: asyncHandler(async (req, res) => {
    const conferenceCode = getConference(req)
    const signal = await signalService.resolve(req.params.id, {
      conferenceCode,
      resolvedBy:     req.user._id,
      resolutionNote: req.body.note ?? null,
    })
    response.success(res, signal)
  }),

  /**
   * POST /admin/signals/sweep — manually trigger a full conference sweep.
   * Useful for testing and for admins who want fresh signals on demand.
   * Runs the engine for ALL conferences (only GC/division admins should use this broadly;
   * conference admins automatically scope to their own conference in the engine).
   */
  sweep: asyncHandler(async (req, res) => {
    // Kick off sweep asynchronously — don't wait for it to complete
    sweepAll().catch(err => {
      const { logger } = require('../core/logger.js')
      logger.error('[signal.controller] Manual sweep error:', err)
    })

    response.success(res, { message: 'Signal sweep triggered. Results will appear in the Intel Feed within moments.' })
  }),
}
