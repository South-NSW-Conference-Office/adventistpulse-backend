import mongoose from 'mongoose'

const dimScoresSchema = new mongoose.Schema({
  spiritual:  { type: Number, min: 0, max: 100 },
  community:  { type: Number, min: 0, max: 100 },
  financial:  { type: Number, min: 0, max: 100 },
  mission:    { type: Number, min: 0, max: 100 },
  leadership: { type: Number, min: 0, max: 100 },
}, { _id: false })

const surveyResponseSchema = new mongoose.Schema({
  sessionId:        { type: mongoose.Schema.Types.ObjectId, ref: 'SurveySession', required: true },
  churchCode:       { type: String, required: true, uppercase: true },
  conferenceCode:   { type: String, required: true, uppercase: true },
  // answers: Map of questionId → Likert value (1–5)
  answers:          { type: Map, of: Number, required: true },
  dimScores:        { type: dimScoresSchema, required: true },
  overallScore:     { type: Number, required: true, min: 0, max: 100 },
  denominationType: { type: String, enum: ['adventist', 'other'], required: true },
  dedupeToken:      { type: String, required: true },
  phoneHash:        { type: String, default: null },
  submittedAt:      { type: Date, default: Date.now },
}, { timestamps: false })

// Dedup index — prevents same token submitting twice per session
surveyResponseSchema.index(
  { sessionId: 1, dedupeToken: 1 },
  { unique: true, partialFilterExpression: { dedupeToken: { $type: 'string' } } }
)
surveyResponseSchema.index({ sessionId: 1 })
surveyResponseSchema.index({ churchCode: 1 })

export const SurveyResponse = mongoose.model('SurveyResponse', surveyResponseSchema)
