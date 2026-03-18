/**
 * Signal Job — scheduled sweeps of the signal engine.
 *
 * Light pass (every 15 minutes): staffing vacancies + delegation expiry.
 * Heavy pass (nightly 2am AEST): membership trends, financial anomalies,
 *   data quality. (Phase 2 — stubs in signal.engine.js)
 *
 * Uses node-cron. Add to startup in app.js or index.js:
 *   import './jobs/signal.job.js'
 *
 * NOTE: In a multi-process deployment, run the scheduler only in one process
 * (worker 0 if using cluster). The signal.engine.js handles per-conference
 * sweeps independently so you can also run them as separate queue workers.
 */

import cron from 'node-cron'
import { OrgUnit }       from '../models/OrgUnit.js'
import { runSignalSweep } from '../services/signal.engine.js'
import { logger }         from '../core/logger.js'

let isRunning = false  // guard against overlapping runs

/**
 * Sweep all active conferences.
 * Collects unique conferenceCodes from OrgUnit and sweeps each in sequence.
 */
async function sweepAll() {
  if (isRunning) {
    logger.warn('[signal-job] Sweep already running — skipping this tick')
    return
  }

  isRunning = true
  const start = Date.now()

  try {
    // Get distinct conference codes from active OrgUnits
    const codes = await OrgUnit.distinct('code', { level: 'conference', isActive: { $ne: false } })
    logger.info(`[signal-job] Starting sweep for ${codes.length} conferences`)

    for (const code of codes) {
      try {
        await runSignalSweep(code)
      } catch (err) {
        logger.error(`[signal-job] Failed sweep for ${code}: ${err.message}`)
      }
    }

    logger.info(`[signal-job] All sweeps complete in ${Date.now() - start}ms`)
  } finally {
    isRunning = false
  }
}

// Light pass — every 15 minutes (staffing + delegations)
cron.schedule('*/15 * * * *', () => {
  logger.info('[signal-job] Light pass triggered')
  sweepAll().catch(err => logger.error('[signal-job] Unhandled error in sweepAll:', err))
})

// Heavy pass — 2am AEST daily (UTC+11 = 15:00 UTC)
// TODO (Phase 2): uncomment when membership/financial checks are implemented
// cron.schedule('0 15 * * *', () => {
//   logger.info('[signal-job] Nightly heavy pass triggered')
//   sweepAll().catch(err => logger.error('[signal-job] Unhandled error in sweepAll:', err))
// })

logger.info('[signal-job] Scheduler registered — light pass every 15 minutes')

export { sweepAll }
