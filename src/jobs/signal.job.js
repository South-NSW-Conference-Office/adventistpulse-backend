/**
 * Signal Job — scheduled sweeps of the signal engine.
 *
 * Does NOT register cron jobs on import (no side effects).
 * Call startScheduler() explicitly from index.js after the DB is connected.
 *
 * Light pass (every 15 minutes): staffing vacancies + delegation expiry —
 *   scoped to conferences that actually have churches (Fix 1).
 * Heavy pass (nightly 2am AEST): membership trends, financial anomalies,
 *   data quality checks. (Phase 2 — uncomment when entity-history is built)
 *
 * Design principles:
 *   SRP — this module owns scheduling only; sweep logic lives in signal.engine.js
 *   OCP — add new cron passes without touching existing ones
 *   DRY — conference discovery is a single function (getActiveConferenceCodes)
 */

import cron                        from 'node-cron'
import { OrgUnit }                 from '../models/OrgUnit.js'
import { runSignalSweep }          from '../services/signal.engine.js'
import { rebuildAllComputedStats } from '../services/stats.service.js'
import { logger }                  from '../core/logger.js'

// ── Overlap guard (single-process) ───────────────────────────────────────────
// Prevents overlapping sweepAll() runs if a pass takes longer than the cron interval.
// For multi-process deployments, replace with a distributed lock (e.g. Redis SET NX).
let isRunning = false

// ── Conference discovery ──────────────────────────────────────────────────────

/**
 * Returns conference codes that own at least one church document.
 *
 * DRY: single source of truth for "which conferences have real data".
 *   Both the scheduler and any future diagnostic tools call this function —
 *   no duplicated OrgUnit queries scattered across the codebase.
 *
 * Why `conferenceCode` on church documents rather than `level: 'conference'`:
 *   Querying OrgUnit.distinct('code', { level: 'conference' }) returns ~500
 *   conference shells, ~95% of which have zero churches in the DB right now.
 *   Querying `conferenceCode` on actual church documents returns only the
 *   handful that have real data — cutting wasted DB round-trips by ~95%.
 *
 * @returns {Promise<string[]>} Uppercase conference codes with ≥1 church
 */
async function getActiveConferenceCodes() {
  return OrgUnit.distinct('conferenceCode', { level: 'church', hidden: { $ne: true } })
}

// ── Sweep orchestration ───────────────────────────────────────────────────────

/**
 * Sweep all conferences that have churches.
 *
 * SRP: orchestration only — delegates per-conference logic to runSignalSweep().
 * Used by the scheduler; admins use runSignalSweep(code) directly for manual sweeps.
 */
export async function sweepAll() {
  if (isRunning) {
    logger.warn('[signal-job] Sweep already running — skipping this tick')
    return
  }

  isRunning = true
  const start = Date.now()

  try {
    const codes = await getActiveConferenceCodes()

    if (codes.length === 0) {
      logger.info('[signal-job] No conferences with churches found — sweep skipped')
      return
    }

    logger.info(`[signal-job] Starting sweep for ${codes.length} active conferences`)

    for (const code of codes) {
      try {
        await runSignalSweep(code)
      } catch (err) {
        logger.error(`[signal-job] Failed sweep for ${code}`, err)
      }
    }

    logger.info(`[signal-job] Sweep complete in ${Date.now() - start}ms — ${codes.length} conferences`)
  } finally {
    isRunning = false
  }
}

// ── Scheduler registration ────────────────────────────────────────────────────

/**
 * Register cron schedules. Call this once from index.js after connectDB().
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
  // Only sweeps conferences that have churches — see getActiveConferenceCodes().
  cron.schedule('*/15 * * * *', () => {
    logger.info('[signal-job] Light pass triggered')
    sweepAll().catch(err => logger.error('[signal-job] Unhandled error in sweepAll', err))
  })

  // Heavy pass — 2am AEST daily (UTC+11 = 15:00 UTC)
  // Runs full signal sweep + rebuilds all computed stats (country-growth, country-membership).
  cron.schedule('0 15 * * *', () => {
    logger.info('[signal-job] Nightly heavy pass triggered')
    sweepAll()
      .then(() => rebuildAllComputedStats())
      .catch(err => logger.error('[signal-job] Unhandled error in nightly pass', err))
  })

  logger.info('[signal-job] Scheduler registered — light pass every 15 minutes (active conferences only)')
}
