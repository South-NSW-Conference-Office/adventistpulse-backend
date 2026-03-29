/**
 * VitalityV2Response — stores a single pastor-submitted Vitality Check 2.0 assessment.
 * One document per submission; churches may submit annually.
 */
import mongoose from 'mongoose'

// ─── Sub-schema: individual dimension score ────────────────────────────────────
const dimensionScoreSchema = new mongoose.Schema({
  id:         { type: String, required: true },          // 'spiritualDepth', 'growthHealth', etc.
  label:      { type: String, required: true },          // human-readable label
  score:      { type: Number, min: 0, max: 100 },        // null if data unavailable (Growth Health)
  band:       { type: String, enum: ['thriving', 'healthy', 'developing', 'at-risk', 'no-data'] },
  confidence: { type: String, enum: ['live', 'self-reported', 'incomplete'] },
}, { _id: false })

// ─── Sub-schema: data snapshot ────────────────────────────────────────────────
const dataSnapshotSchema = new mongoose.Schema({
  // YearlyStats snapshot (most recent year used)
  year:              Number,
  baptisms:          Number,
  beginningMembership: Number,
  endingMembership:  Number,
  transfersIn:       Number,
  transfersOut:      Number,
  deaths:            Number,
  dropped:           Number,        // apostasies proxy
  netGrowth:         Number,
  // Derived from PulseNotes
  avgAttendance:     Number,        // calculated from weekly notes
  avgYouthAttendance:Number,        // from notes with youth field
  // Prior year membership for trend calculation
  priorYearMembership: Number,
  priorYear:         Number,
  // Manual overrides (if pastor-provided)
  manualOverrides:   { type: Map, of: Number, default: () => new Map() },
}, { _id: false })

// ─── Main schema ────────────────────────────────────────────────────────────────
const vitalityV2ResponseSchema = new mongoose.Schema({
  churchCode:     { type: String, required: true, uppercase: true, trim: true, index: true },
  submittedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Raw responses map: questionId → Likert value 1–5
  responses:      { type: Map, of: Number, required: true },

  // Computed dimension scores
  scores:         { type: [dimensionScoreSchema], required: true },

  // Overall composite score (0–100)
  overallScore:   { type: Number, required: true, min: 0, max: 100 },

  // The dimension with the lowest score — the "growth ceiling"
  minimumFactor:  {
    id:    { type: String, required: true },
    label: { type: String, required: true },
    score: { type: Number, required: true },
  },

  // Overall band
  band:           { type: String, enum: ['thriving', 'healthy', 'developing', 'at-risk'], required: true },

  // DB snapshot used at time of submission
  dataSnapshot:   { type: dataSnapshotSchema, default: () => ({}) },

  createdAt:      { type: Date, default: Date.now },
}, { timestamps: false })

// Index for history queries
vitalityV2ResponseSchema.index({ churchCode: 1, createdAt: -1 })

export const VitalityV2Response = mongoose.model('VitalityV2Response', vitalityV2ResponseSchema)
