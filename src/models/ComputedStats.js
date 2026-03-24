/**
 * ComputedStats — stores expensive pre-computed aggregations.
 *
 * Used for data that would be slow to compute on every request (country-level
 * growth rates, membership density, etc.). A background job rebuilds each key
 * on a schedule; the API serves the cached result and triggers a rebuild when stale.
 *
 * SRP: this model owns storage only — computation logic lives in stats.service.js.
 */

import mongoose from 'mongoose'

const computedStatsSchema = new mongoose.Schema({
  /** Unique key identifying the dataset — e.g. 'country-growth', 'country-membership' */
  key:       { type: String, required: true, unique: true },

  /** The computed payload. Shape depends on key — validated in stats.service.js */
  data:      { type: mongoose.Schema.Types.Mixed, required: true },

  /** When this result was last computed */
  builtAt:   { type: Date, required: true },

  /** When this result should be considered stale and rebuilt */
  expiresAt: { type: Date, required: true },

  /** How long the build took in ms (for monitoring) */
  buildMs:   { type: Number, default: null },
}, { timestamps: false })

computedStatsSchema.index({ key: 1 })
computedStatsSchema.index({ expiresAt: 1 })

export const ComputedStats = mongoose.model('ComputedStats', computedStatsSchema)
