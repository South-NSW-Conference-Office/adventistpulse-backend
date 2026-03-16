import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema({
  slug:             { type: String, required: true, unique: true, trim: true },
  type:             { type: String, required: true, enum: ['vital-signs', 'brief', 'state-of-adventism'] },
  title:            { type: String, trim: true },
  subtitle:         { type: String, trim: true },
  summary:          { type: String },
  date:             { type: Date },
  year:             { type: Number },
  readTime:         { type: String },
  featured:         { type: Boolean, default: false },
  tags:             [String],

  // vital-signs fields
  entityCode:       { type: String },
  entityName:       { type: String },
  entityLevel:      { type: String },
  parentCodes:      [String],

  // briefs fields
  category:         { type: String },
  lrpSource:        { type: String },
  heroStat:         { type: String },
  heroStatLabel:    { type: String },
  body:             { type: String },
  pullQuote:        { type: String },
  sourceNote:       { type: String },
  discussionPrompt: { type: String },
}, { timestamps: true })

reportSchema.index({ type: 1 })
reportSchema.index({ year: 1 })
reportSchema.index({ entityCode: 1 })
reportSchema.index({ featured: 1 })

export const Report = mongoose.model('Report', reportSchema)
