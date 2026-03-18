import mongoose from 'mongoose'

/**
 * TrajectoryItem — a single time-series metric for an institution
 * e.g. revenue, expenses, enrollment over multiple years
 */
const trajectoryItemSchema = new mongoose.Schema({
  metric:     { type: String, required: true },   // "Total Revenue"
  source:     { type: String, required: true },   // "ACNC Annual Filing 2023"
  unit:       { type: String, required: true },   // "AUD $M"
  color:      { type: String },                   // hex color for chart line
  isEstimate: { type: Boolean, default: true },   // false = verified from primary source
  data: [{
    year:  { type: Number, required: true },
    value: { type: Number, required: true },
  }],
}, { _id: false })

/**
 * Institution — non-church Adventist entities: schools, hospitals, ADRA, media, food, publishing
 * These are separate from OrgUnit (which models the church hierarchy).
 */
const institutionSchema = new mongoose.Schema({
  code: {
    type: String, required: true, unique: true, uppercase: true, trim: true,
    // e.g. 'SAH-SYDNEY', 'AVONDALE-AU', 'SANITARIUM-AU'
  },
  name:        { type: String, required: true, trim: true },
  type: {
    type: String, required: true,
    enum: ['education', 'health', 'humanitarian', 'media', 'food', 'publishing'],
  },
  country:        { type: String, required: true },
  region:         { type: String, required: true },    // e.g. "South Pacific Division"
  conferenceCode: { type: String, default: null },     // links to OrgUnit.code if applicable

  yearFounded: { type: Number, min: 1800, max: 2100 },
  website:     { type: String },
  description: { type: String },

  // Flexible key-value stats — type-specific (enrollment for schools, beds for hospitals etc.)
  // Using Mixed allows any data without forcing a rigid schema per type
  stats:       { type: mongoose.Schema.Types.Mixed, default: {} },

  tags:        [{ type: String, trim: true }],

  // Human-readable contextual note about the institution (controversies, history, key facts)
  contextNote: { type: String, default: null },

  // Time-series financial/operational data
  trajectory:  [trajectoryItemSchema],

  // ACNC-specific fields (Australian charities)
  acncAbn: { type: String, default: null },   // e.g. "91 032 680 953"
  acncUrl: { type: String, default: null },

  // Data quality tracking
  dataVerified:   { type: Boolean, default: false },  // true = all stats verified from primary source
  dataSource:     { type: String,  default: null },   // e.g. "ACNC 2023 Annual Statement"
  lastVerifiedAt: { type: Date,    default: null },
  lastVerifiedBy: { type: String,  default: null },   // admin username

  // Soft delete
  active: { type: Boolean, default: true },

}, { timestamps: true })

// Indexes for common query patterns
institutionSchema.index({ type: 1 })
institutionSchema.index({ region: 1 })
institutionSchema.index({ country: 1 })
institutionSchema.index({ conferenceCode: 1 })
institutionSchema.index({ active: 1 })
// Text search across name + description + tags
institutionSchema.index({ name: 'text', description: 'text', tags: 'text' })

export const Institution = mongoose.model('Institution', institutionSchema)
