import mongoose from 'mongoose'

/**
 * SurveyQuestion — embedded sub-document.
 * Supports: likert (1-5 or 1-7), yesno, multiplechoice, text, nps (0-10), ranking.
 */
const surveyQuestionSchema = new mongoose.Schema({
  /** Unique within this survey — used as answer Map key */
  questionId:  { type: String, required: true, trim: true },
  text:        { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['likert', 'yesno', 'multiplechoice', 'text', 'nps', 'ranking'],
    required: true,
  },
  /** For multiplechoice and ranking only */
  options: [{ type: String, trim: true }],
  /** For likert: { min: 1, max: 5, minLabel: 'Strongly Disagree', maxLabel: 'Strongly Agree' } */
  scale: {
    min:      { type: Number, default: 1 },
    max:      { type: Number, default: 5 },
    minLabel: { type: String, default: '' },
    maxLabel: { type: String, default: '' },
  },
  required: { type: Boolean, default: true },
  order:    { type: Number, required: true },
  /** AI quality flag — set when AI detects a potential issue */
  aiFlag:   { type: String, default: null },
}, { _id: false })

/**
 * Survey — the survey definition.
 * Vitality Check is a separate fixed flow; this model supports custom surveys.
 */
const surveySchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', trim: true, maxlength: 500 },
  questions:   { type: [surveyQuestionSchema], default: [] },

  /** Owner — the user who created this survey */
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  /** Owning org — conference/union code for scoping */
  ownerOrg: { type: String, required: true, uppercase: true, trim: true },

  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft',
  },

  /** Targeting — set on publish */
  targeting: {
    scope:          { type: String, enum: ['church', 'conference', 'union'], default: 'church' },
    /** Specific church codes when scope = 'church' */
    churchCodes:    [{ type: String, uppercase: true, trim: true }],
    conferenceCode: { type: String, default: null, uppercase: true },
    unionCode:      { type: String, default: null, uppercase: true },
  },

  settings: {
    anonymous:   { type: Boolean, default: true },
    closeDate:   { type: Date, default: null },
    maxResponses:{ type: Number, default: null },
  },

  /** AI generation metadata */
  aiGenerated: { type: Boolean, default: false },
  aiIntent:    { type: String, default: null, trim: true },

  /** Template used as starting point (null = built from scratch) */
  template: { type: String, default: null },

  publishedAt: { type: Date, default: null },
  closedAt:    { type: Date, default: null },
}, { timestamps: true })

surveySchema.index({ owner: 1 })
surveySchema.index({ ownerOrg: 1 })
surveySchema.index({ status: 1 })
surveySchema.index({ 'targeting.conferenceCode': 1 })

export const Survey = mongoose.model('Survey', surveySchema)
