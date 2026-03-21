import mongoose from 'mongoose'

const surveySessionSchema = new mongoose.Schema({
  churchCode:     { type: String, required: true, uppercase: true, trim: true },
  createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conferenceCode: { type: String, required: true, uppercase: true },
  sessionCode:    { type: String, required: true, unique: true, uppercase: true, trim: true },
  // base64 PNG QR code — generated server-side on creation
  qrDataUrl:      { type: String, default: null },
  status:         { type: String, enum: ['active', 'closed'], default: 'active' },
  expiresAt:      { type: Date, required: true },
  responseCount:  { type: Number, default: 0 },
  settings: {
    requirePhone:     { type: Boolean, default: false },
    maxResponses:     { type: Number, default: null },
    expiryMinutes:    { type: Number, default: 60, min: 15, max: 480 },
    denominationType: { type: String, enum: ['adventist', 'other', 'auto'], default: 'auto' },
  },
  closedAt: { type: Date, default: null },
}, { timestamps: true })

surveySessionSchema.index({ churchCode: 1 })
surveySessionSchema.index({ conferenceCode: 1 })
surveySessionSchema.index({ status: 1 })
surveySessionSchema.index({ expiresAt: 1 })

export const SurveySession = mongoose.model('SurveySession', surveySessionSchema)
