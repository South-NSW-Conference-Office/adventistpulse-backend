import mongoose from 'mongoose'

/**
 * SurveyEngineResponse — generic response for custom surveys.
 * Separate from SurveyResponse (which is Vitality Check-specific).
 * Answers stored as a flexible Map: questionId → String|Number|Array.
 */
const surveyEngineResponseSchema = new mongoose.Schema({
  surveyId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
  sessionId:      { type: mongoose.Schema.Types.ObjectId, ref: 'SurveySession', required: true },
  churchCode:     { type: String, required: true, uppercase: true, trim: true },
  conferenceCode: { type: String, required: true, uppercase: true, trim: true },

  /**
   * answers: questionId → value
   * Likert/NPS:         Number
   * YesNo:              'yes' | 'no'
   * MultipleChoice:     String (single) or [String] (multi-select)
   * Ranking:            [String] (ordered)
   * Text:               String
   */
  answers: { type: Map, of: mongoose.Schema.Types.Mixed, required: true },

  dedupeToken: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: false })

// Dedup — prevents same token submitting twice per session
surveyEngineResponseSchema.index(
  { sessionId: 1, dedupeToken: 1 },
  { unique: true, partialFilterExpression: { dedupeToken: { $type: 'string' } } },
)
surveyEngineResponseSchema.index({ surveyId: 1 })
surveyEngineResponseSchema.index({ churchCode: 1 })
surveyEngineResponseSchema.index({ conferenceCode: 1 })

export const SurveyEngineResponse = mongoose.model('SurveyEngineResponse', surveyEngineResponseSchema)
