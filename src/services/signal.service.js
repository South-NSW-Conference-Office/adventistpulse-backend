/**
 * Signal Service — CRUD operations on the Signal collection.
 *
 * All queries are scoped to the calling admin's conferenceCode.
 * The conferenceCode is NEVER accepted from request params/body —
 * it must always come from req.user.subscription.conferenceCode.
 *
 * Signal generation logic lives in signal.engine.js (separate concern).
 */

import { Signal } from '../models/Signal.js'
import { NotFoundError, ForbiddenError } from '../core/errors/index.js'

export const signalService = {

  /**
   * List active signals for a conference, ordered by severity then age.
   * Optionally filter by tier(s).
   *
   * @param {string}   conferenceCode - From req.user.subscription.conferenceCode
   * @param {object}   opts
   * @param {string[]} opts.tiers     - e.g. ['FLASH', 'PRIORITY']
   * @param {boolean}  opts.resolved  - true = include resolved; false = active only (default)
   * @param {number}   opts.limit     - max results (default 100)
   */
  async list(conferenceCode, { tiers = [], resolved = false, limit = 100 } = {}) {
    const query = {
      conferenceCode: conferenceCode.toUpperCase(),
      resolvedAt:     resolved ? { $exists: true } : null,
    }

    if (tiers.length > 0) {
      query.tier = { $in: tiers.map(t => t.toUpperCase()) }
    }

    // Order: FLASH first, then PRIORITY, then ROUTINE; within each tier, oldest first
    const TIER_ORDER = { FLASH: 0, PRIORITY: 1, ROUTINE: 2 }

    const signals = await Signal
      .find(query)
      .sort({ generatedAt: 1 })
      .limit(Math.min(limit, 500))
      .lean()

    signals.sort((a, b) => (TIER_ORDER[a.tier] ?? 3) - (TIER_ORDER[b.tier] ?? 3))
    return signals
  },

  /**
   * Count active signals by tier for a conference.
   * Used for the tier badge counts on the Intel Feed header.
   */
  async counts(conferenceCode) {
    const results = await Signal.aggregate([
      { $match: { conferenceCode: conferenceCode.toUpperCase(), resolvedAt: null } },
      { $group: { _id: '$tier', count: { $sum: 1 } } },
    ])

    return results.reduce((acc, { _id, count }) => {
      acc[_id] = count
      return acc
    }, { FLASH: 0, PRIORITY: 0, ROUTINE: 0 })
  },

  /**
   * Get all active signals for a specific church.
   * Verifies the church belongs to the admin's conference.
   */
  async forChurch(churchCode, conferenceCode) {
    return Signal.find({
      churchCode:     churchCode.toUpperCase(),
      conferenceCode: conferenceCode.toUpperCase(), // belt-and-braces territory filter
      resolvedAt:     null,
    }).sort({ tier: 1, generatedAt: 1 }).lean()
  },

  /**
   * Resolve a signal.
   * Verifies the signal belongs to the admin's conference before resolving.
   */
  async resolve(signalId, { conferenceCode, resolvedBy, resolutionNote }) {
    const signal = await Signal.findOne({
      _id:            signalId,
      conferenceCode: conferenceCode.toUpperCase(), // ownership check
    })

    if (!signal) throw new NotFoundError('Signal not found in your territory')
    if (signal.resolvedAt) throw new ForbiddenError('Signal is already resolved')

    signal.resolvedAt     = new Date()
    signal.resolvedBy     = resolvedBy
    signal.resolutionNote = resolutionNote ?? null
    await signal.save()
    return signal
  },

  /**
   * Upsert a signal from the engine.
   * Uses dedupKey to prevent duplicate active signals for the same condition.
   *
   * If resolvedAt is explicitly passed as a Date, the signal is being auto-resolved
   * (condition has cleared — e.g. a pastor was assigned to the previously vacant church).
   */
  async upsert({ dedupKey, conferenceCode, churchCode, tier, signalType, signal, detail, data, resolvedAt = null }) {
    const existing = await Signal.findOne({ dedupKey, resolvedAt: null })

    if (resolvedAt) {
      // Condition has cleared — auto-resolve any open signal for this dedup key
      if (existing) {
        existing.resolvedAt     = resolvedAt
        existing.resolutionNote = 'Auto-resolved: condition no longer detected'
        await existing.save()
      }
      return null
    }

    if (existing) {
      // Condition still present — update the detail/data in case numbers changed
      existing.signal = signal
      existing.detail = detail
      existing.data   = data ?? existing.data
      existing.tier   = tier
      await existing.save()
      return existing
    }

    // New signal
    return Signal.create({
      dedupKey,
      conferenceCode: conferenceCode.toUpperCase(),
      churchCode:     churchCode.toUpperCase(),
      tier,
      signalType,
      signal,
      detail,
      data:      data ?? null,
      source:    'engine',
    })
  },
}
