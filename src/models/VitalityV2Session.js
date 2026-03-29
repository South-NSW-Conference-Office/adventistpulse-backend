/**
 * VitalityV2Session — congregation-answered Vitality Check 2.0 session.
 *
 * Design: pastor creates a session, members submit their answers,
 * results are aggregated (min 5 responses) and calculated by the pastor.
 *
 * Distinct from VitalityV2Response (the old pastor-self-assessment model).
 */
import mongoose from 'mongoose'

// ─── Sub-schema: single member response ──────────────────────────────────────
const memberResponseSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // answers: Map of questionId → Likert value (1–5)
  answers:     { type: Map, of: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
}, { _id: false })

// ─── Sub-schema: calculated dimension scores ──────────────────────────────────
const scoresSchema = new mongoose.Schema({
  spiritual:   { type: Number, min: 0, max: 100 },  // Spiritual Depth
  community:   { type: Number, min: 0, max: 100 },  // Community Presence
  belonging:   { type: Number, min: 0, max: 100 },  // Belonging & Retention
  generational:{ type: Number, min: 0, max: 100 },  // Generational Health
  growth:      { type: Number, min: 0, max: 100 },  // Growth Health (auto from DB)
  activation:  { type: Number, min: 0, max: 100 },  // Member Activation
  leadership:  { type: Number, min: 0, max: 100 },  // Leadership Empowerment
}, { _id: false })

// ─── Sub-schema: DB data snapshot at time of calculation ──────────────────────
const dataSnapshotSchema = new mongoose.Schema({
  year:               Number,
  baptisms:           Number,
  beginMembership:    Number,  // YearlyStats.membership.beginning
  endMembership:      Number,  // YearlyStats.membership.ending
  transfersIn:        Number,
  transfersOut:       Number,
  deaths:             Number,
  dropped:            Number,
  netGrowth:          Number,
  retentionRate:      Number,  // computed: 1 - (dropped+deaths+transfersOut)/beginning
  priorYearMembership:Number,
  priorYear:          Number,
}, { _id: false })

// ─── Main schema ──────────────────────────────────────────────────────────────
const vitalityV2SessionSchema = new mongoose.Schema({
  churchCode:  { type: String, required: true, uppercase: true, trim: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionCode: { type: String, required: true, unique: true, uppercase: true, trim: true },

  status: {
    type:    String,
    enum:    ['active', 'closed', 'expired'],
    default: 'active',
  },

  expiresAt: { type: Date, required: true },
  closedAt:  { type: Date, default: null },

  // Denormalized response count — kept in sync to avoid loading the full responses array
  responseCount: { type: Number, default: 0 },

  // All member responses
  responses: { type: [memberResponseSchema], default: [] },

  // Scores — populated only after calculate is triggered
  scores:        { type: scoresSchema, default: null },
  overallScore:  { type: Number, min: 0, max: 100, default: null },
  minimumFactor: {
    id:    { type: String },
    label: { type: String },
    score: { type: Number },
  },
  band: {
    type: String,
    enum: ['thriving', 'healthy', 'developing', 'at-risk'],
    default: null,
  },

  // DB snapshot at calculation time
  dataSnapshot: { type: dataSnapshotSchema, default: null },

  calculatedAt: { type: Date, default: null },
}, { timestamps: true })

vitalityV2SessionSchema.index({ churchCode: 1, createdAt: -1 })
vitalityV2SessionSchema.index({ sessionCode: 1 }, { unique: true })
vitalityV2SessionSchema.index({ status: 1, expiresAt: 1 })

export const VitalityV2Session = mongoose.model('VitalityV2Session', vitalityV2SessionSchema)
