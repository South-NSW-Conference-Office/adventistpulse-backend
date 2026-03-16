import mongoose from 'mongoose'

const yearlyStatsSchema = new mongoose.Schema({
  entityCode: { type: String, required: true, uppercase: true, trim: true },
  year:       { type: Number, required: true },
  churches:   Number,
  companies:  Number,
  membership: {
    beginning:        Number,
    ending:           Number,
    baptisms:         Number,
    professionOfFaith:Number,
    transfersIn:      Number,
    transfersOut:     Number,
    deaths:           Number,
    dropped:          Number,
    missing:          Number,
    totalGains:       Number,
    totalLosses:      Number,
    netGrowth:        Number,
    growthRate:       Number,
    retentionRate:    Number,
    dropoutRate:      Number,
    lossRate:         Number,
    accessionRate:    Number,
    totalAccessions:  Number,
  },
  workers: {
    ordainedMinisters:    Number,
    licensedMinisters:    Number,
    licensedMissionaries: Number,
    literatureEvangelists:Number,
    totalWorkers:         Number,
  },
  finance: {
    tithe:         Number,
    titheCurrency: { type: String, default: 'USD' },
    offerings:     Number,
  },
  derived: {
    membersPerWorker: Number,
    tithePerCapita:   Number,
  },
  source: {
    type: String,
    enum: ['adventiststatistics.org', 'manual', 'session_report'],
    default: 'manual',
  },
  sourceUrl: String,
  verified:  { type: Boolean, default: false },
}, { timestamps: true })

// Compound unique index — one record per entity per year
yearlyStatsSchema.index({ entityCode: 1, year: 1 }, { unique: true })
yearlyStatsSchema.index({ entityCode: 1 })

export const YearlyStats = mongoose.model('YearlyStats', yearlyStatsSchema)
