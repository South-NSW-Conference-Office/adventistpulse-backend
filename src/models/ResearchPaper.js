import mongoose from 'mongoose'

const researchPaperSchema = new mongoose.Schema({
  id:                 { type: String, required: true, unique: true, index: true },
  title:              { type: String, required: true },
  coreQuestion:       { type: String },
  status:             { type: String },
  grade:              { type: String },
  score:              { type: Number, default: 0 },
  confidence:         { type: String },
  tags:               { type: [String], default: [] },
  regions:            { type: [String], default: [] },
  rootQuestions:      { type: [String], default: [] },
  sourceCount:        { type: Number, default: 0 },
  primarySources:     { type: Number, default: 0 },
  wordCount:          { type: Number, default: 0 },
  bodyLength:         { type: Number, default: 0 },
  lastUpdated:        { type: Date },
  execSummary:        { type: String },
  keyFindings:        { type: [String], default: [] },
  references:         { type: [String], default: [] },
  qualityBreakdown:   { type: mongoose.Schema.Types.Mixed, default: {} },
  bibleReferences:    { type: [String], default: [] },
  australianRelevance: { type: String },
  pulseNotesEnabled:  { type: Boolean, default: false },
  parentLrp:          { type: String },
  featured:           { type: Boolean, default: false },
  file:               { type: String },
  body:               { type: String },
}, { timestamps: true })

researchPaperSchema.index({ status: 1 })
researchPaperSchema.index({ featured: 1 })
researchPaperSchema.index({ tags: 1 })

export const ResearchPaper = mongoose.model('ResearchPaper', researchPaperSchema)
