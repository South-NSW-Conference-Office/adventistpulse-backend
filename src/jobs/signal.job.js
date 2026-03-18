/**
 * Signal Job — scheduled sweeps of the signal engine.
 *
 * Does NOT register cron jobs on import (no side effects).
 * Call startScheduler() explicitly from index.js after the DB is connected.
 *
 * Light pass (every 15 minutes): staffing vacancies + delegation expiry.
 * Heavy pass (nightly 2am AEST): membership trends, financial anomalies,
 *   data quality checks. (Phase 2 — uncomment when entity-history is built)
 */

import cron                from 'node-cron'
import { OrgUnit }         from '../models/OrgUnit.js'
import { runSignalSweep }  from '../services/signal.engine.js'
import { logger }          from '../core/logger.js'

let isRunning = false  // guard against overlapping runs

/**
 * Sweep all active conferences.
 * Used by the scheduler for full passes. Individual admins should use
 * runSignalSweep(conferenceCode) directly to scope to their territory.
 */
export async function sweepAll() {
  if (isRunning) {
    logger.warn('[signal-job] Sweep already running — skipping this tick')
    return
  }

  isRunning = true
  const start = Date.now()

  try {
    const codes = await OrgUnit.distinct('code', { level: 'conference' })
    logger.info(`[signal-job] Starting sweep for ${codes.length} conferences`)

    for (const code of codes) {
      try {
        await runSignalSweep(code)
      } catch (err) {
        logger.error(`[signal-job] Failed sweep for ${code}`, err)
      }
    }

    logger.info(`[signal-job] All sweeps complete in ${Date.now() - start}ms`)
  } finally {
    isRunning = false
  }
}

/**
 * Register cron schedules. Call this once from index.js after connectDB().
 * Keeping cron registration here (not in app.js) so it only runs in the
 * server process, not in test runners or other importers of the app.
 *
 * PM2 cluster guard: in cluster mode every worker would call startScheduler(),
 * running N sweeps per tick. Only register on worker 0 (or non-cluster).
 * NODE_APP_INSTANCE is set by PM2; undefined in single-process or test.
 */
export function startScheduler() {
  const workerId = process.env.NODE_APP_INSTANCE
  if (workerId !== undefined && workerId !== '0') {
    logger.info(`[signal-job] Skipping scheduler registration on worker ${workerId} (cluster mode)`)
    return
  }

  // Light pass — every 15 minutes (staffing + delegations)
  cron.schedule('*/15 * * * *', () => {
    logger.info('[signal-job] Light pass triggered')
    sweepAll().catch(err => logger.error('[signal-job] Unhandled error in sweepAll', err))
  })

  // Heavy pass — 2am AEST daily (UTC+11 = 15:00 UTC)
  // TODO (Phase 2): uncomment when membership/financial checks are implemented
  // cron.schedule('0 15 * * *', () => {
  //   logger.info('[signal-job] Nightly heavy pass triggered')
  //   sweepAll().catch(err => logger.error('[signal-job] Unhandled error in sweepAll', err))
  // })

  logger.info('[signal-job] Scheduler registered — light pass every 15 minutes')
}
