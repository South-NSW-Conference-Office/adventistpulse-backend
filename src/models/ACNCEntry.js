import mongoose from 'mongoose'

/**
 * ACNCEntry — financial data for Australian Adventist charities
 * Source: ACNC (Australian Charities and Not-for-profits Commission) public register
 * All Australian charities must file annually — this data is public record.
 *
 * Separate model from Institution because:
 * - Different update cadence (annually, per financial year)
 * - May have multiple years per institution (historical view)
 * - Some entities won't have a matching Institution record
 */
const acncEntrySchema = new mongoose.Schema({
  // Optional link to Institution record
  institutionCode: { type: String, default: null, uppercase: true },

  name:    { type: String, required: true, trim: true },
  abn:     { type: String, default: null, trim: true },
  acncUrl: { type: String, default: null },
  type: {
    type: String, required: true,
    enum: ['conference', 'institution', 'charity', 'school', 'hospital', 'media', 'other'],
  },
  financialYear: { type: String, required: true },  // e.g. "2022-23"

  // Financial figures — all AUD
  totalRevenue:       { type: Number, default: null },
  totalExpenses:      { type: Number, default: null },
  totalAssets:        { type: Number, default: null },
  netAssets:          { type: Number, default: null },
  programExpenditure: { type: Number, default: null },  // charities only
  adminExpenditure:   { type: Number, default: null },

  notes: { type: String, default: null },

  // Data quality
  verified:   { type: Boolean, default: false },  // true = pulled directly from ACNC filing
  verifiedAt: { type: Date,    default: null },
  verifiedBy: { type: String,  default: null },   // admin username or "morpheus"

  active: { type: Boolean, default: true },

}, { timestamps: true })

acncEntrySchema.index({ institutionCode: 1 })
acncEntrySchema.index({ type: 1 })
acncEntrySchema.index({ financialYear: 1 })
acncEntrySchema.index({ verified: 1 })

export const ACNCEntry = mongoose.model('ACNCEntry', acncEntrySchema)
