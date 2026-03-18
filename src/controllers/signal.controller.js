import { signalService }   from '../services/signal.service.js'
import { runSignalSweep }  from '../services/signal.engine.js'
import { response }        from '../core/response.js'
import { asyncHandler }    from './base.controller.js'
import { ForbiddenError }  from '../core/errors/index.js'
import { logger }          from '../core/logger.js'

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
    const { tiers, resolved, limit } = req.query // validated + transformed by middleware

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
   * POST /admin/signals/sweep — manually trigger a sweep for this admin's conference only.
   * Does not sweep other conferences — scoped to req.user.subscription.conferenceCode.
   * Runs asynchronously; responds immediately so the client isn't left waiting.
   */
  sweep: asyncHandler(async (req, res) => {
    const conferenceCode = getConference(req)

    // Fire and forget — don't await. Signals will appear in the feed within moments.
    runSignalSweep(conferenceCode).catch(err => {
      logger.error('[signal.controller] Manual sweep error', err)
    })

    response.success(res, {
      message: `Signal sweep triggered for ${conferenceCode}. Results will appear in the Intel Feed within moments.`,
    })
  }),
}
