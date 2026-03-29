/**
 * GiftAssessment — stores a completed Spiritual Gifts assessment.
 *
 * Supports both anonymous (no userId) and authenticated submissions.
 * Anonymous results can be claimed later via claimAssessment().
 */
import mongoose from 'mongoose'

// ─── Sub-schemas ────────────────────────────────────────────────────────────

const responseSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  giftId:     { type: String, required: true },
  score:      { type: Number, required: true, min: 1, max: 5 },
}, { _id: false })

const giftScoreSchema = new mongoose.Schema({
  giftId:       { type: String, required: true },
  totalScore:   { type: Number, required: true },
  averageScore: { type: Number, required: true },
  rank:         { type: Number, required: true },
}, { _id: false })

// ─── Main schema ────────────────────────────────────────────────────────────

const giftAssessmentSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  churchCode:   { type: String, default: null, uppercase: true, trim: true },
  sessionToken: { type: String, required: true, unique: true },

  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, lowercase: true, trim: true },

  version: {
    type: String,
    enum: ['standard', 'adventist'],
    default: 'adventist',
  },

  // ── Adaptive two-phase fields ────────────────────────────────────────────
  phase: {
    type: String,
    enum: ['screening', 'deep', 'complete'],
    default: 'screening',
  },

  phase1Responses: [{ questionId: String, giftId: String, score: Number }],
  phase2Responses: [{ questionId: String, giftId: String, score: Number }],
  phase2Candidates: [{ type: String }],

  // ── Legacy / full-battery response store ─────────────────────────────────
  responses: { type: [responseSchema], default: [] },

  scores: { type: [giftScoreSchema], default: [] },

  primaryGift:   { type: String, default: null },
  secondaryGift: { type: String, default: null },
  tertiaryGift:  { type: String, default: null },

  ministryRecommendations: { type: [String], default: [] },

  completedAt: { type: Date, default: null },
  claimedAt:   { type: Date, default: null },

  includeInResearch: { type: Boolean, default: true },
}, { timestamps: true })

// ─── Indexes ────────────────────────────────────────────────────────────────

giftAssessmentSchema.index({ userId: 1 })
giftAssessmentSchema.index({ churchCode: 1 })
giftAssessmentSchema.index({ sessionToken: 1 }, { unique: true })
giftAssessmentSchema.index({ email: 1 })

export const GiftAssessment = mongoose.model('GiftAssessment', giftAssessmentSchema)
