/**
 * seed-yearly-stats.js
 *
 * Seeds the `yearlystats` collection from the OASR yearbook JSON.
 * Default data file: ../../bem-adventistpulse/_team-docs/yearbook-data/statistics.json
 * Override: pass a path as the first argument (excluding --dry-run).
 *
 * Usage:
 *   node scripts/seed-yearly-stats.js                # write to DB (upsert safe)
 *   node scripts/seed-yearly-stats.js --dry-run      # validate only, no writes
 *   node scripts/seed-yearly-stats.js /path/to/statistics.json
 *   node scripts/seed-yearly-stats.js /path/to/statistics.json --dry-run
 *
 * Safe to re-run — uses upsert on { entityCode, year }.
 */

import mongoose from 'mongoose'
import dotenv   from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

// ── CLI args ──────────────────────────────────────────────────────────────────

const args    = process.argv.slice(2)
const dryRun  = args.includes('--dry-run')
const filePath = args.find(a => !a.startsWith('--')) ??
  resolve(__dirname, '../_team-docs/yearbook-data/statistics.json')

// ── MongoDB ───────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI
if (!MONGO_URI) { console.error('❌ MONGODB_URI not set in .env'); process.exit(1) }

// ── Inline schema (avoids import issues in scripts) ──────────────────────────

const yearlyStatsSchema = new mongoose.Schema({
  entityCode: { type: String, required: true, uppercase: true, trim: true },
  year:       { type: Number, required: true },
  churches:   Number,
  companies:  Number,
  membership: {
    beginning:         Number,
    ending:            Number,
    baptisms:          Number,
    professionOfFaith: Number,
    transfersIn:       Number,
    transfersOut:      Number,
    deaths:            Number,
    dropped:           Number,
    missing:           Number,
    totalGains:        Number,
    totalLosses:       Number,
    netGrowth:         Number,
    growthRate:        Number,
    retentionRate:     Number,
    dropoutRate:       Number,
    lossRate:          Number,
    accessionRate:     Number,
    totalAccessions:   Number,
  },
  workers: {
    ordainedMinisters:     Number,
    licensedMinisters:     Number,
    licensedMissionaries:  Number,
    literatureEvangelists: Number,
    totalWorkers:          Number,
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

yearlyStatsSchema.index({ entityCode: 1, year: 1 }, { unique: true })
yearlyStatsSchema.index({ entityCode: 1 })

const YearlyStats = mongoose.model('YearlyStats', yearlyStatsSchema)

// ── Mapping ───────────────────────────────────────────────────────────────────

function mapRecord(src) {
  const totalGains  = (src.baptisms ?? 0) + (src.professionOfFaith ?? 0) + (src.transfers_in ?? 0)
  const totalLosses = (src.transfers_out ?? 0) + (src.deaths ?? 0) + (src.apostasies ?? 0) + (src.missing ?? 0)

  return {
    entityCode: src.entityCode,
    year:       src.year,
    churches:   src.churches  ?? null,
    companies:  src.companies ?? null,
    membership: {
      ending:            src.membership        ?? null,
      baptisms:          src.baptisms          ?? null,
      professionOfFaith: src.professionOfFaith ?? null,
      transfersIn:       src.transfers_in      ?? null,
      transfersOut:      src.transfers_out     ?? null,
      deaths:            src.deaths            ?? null,
      dropped:           src.apostasies        ?? null,   // apostasies → dropped
      missing:           src.missing           ?? null,
      totalGains,
      totalLosses,
      netGrowth:         src.net_gain          ?? null,
      // growthRate computed after all records are loaded
    },
    // workers and finance not present in this source — leave unset
    source:   src.source ?? 'adventiststatistics.org',
    verified: false,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  // ── Load source file ──
  console.log(`📂 Loading: ${filePath}`)
  let raw
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (err) {
    console.error(`❌ Could not read ${filePath}:`, err.message)
    process.exit(1)
  }
  console.log(`📦 Loaded ${raw.length} records from source file`)

  // ── Map records ──
  const mapped = raw.map(mapRecord)

  // ── Compute growthRate per entity (requires prior year's membership) ──
  // Group by entityCode, sort by year, look back one year
  const byEntity = {}
  for (const rec of mapped) {
    if (!byEntity[rec.entityCode]) byEntity[rec.entityCode] = []
    byEntity[rec.entityCode].push(rec)
  }

  for (const records of Object.values(byEntity)) {
    records.sort((a, b) => a.year - b.year)
    for (let i = 0; i < records.length; i++) {
      if (i === 0) continue
      const prior   = records[i - 1].membership?.ending
      const current = records[i].membership?.ending
      if (prior != null && prior > 0 && current != null) {
        records[i].membership.growthRate = +((( current - prior) / prior) * 100).toFixed(4)
      }
    }
  }

  const entities  = Object.keys(byEntity)
  const years     = [...new Set(mapped.map(r => r.year))].sort()
  const yearRange = `${years[0]}–${years[years.length - 1]}`

  if (dryRun) {
    console.log(`\n🔍 DRY RUN — no database writes`)
    console.log(`   Records : ${mapped.length}`)
    console.log(`   Entities: ${entities.length} (${entities.join(', ')})`)
    console.log(`   Years   : ${yearRange}`)
    // Show a sample record
    const sample = mapped.find(r => r.membership.growthRate != null)
    if (sample) {
      console.log('\nSample record (with growthRate):')
      console.log(JSON.stringify(sample, null, 2))
    }
    console.log(`\n✓ Dry run complete — ${mapped.length} YearlyStats records ready to upsert`)
    process.exit(0)
  }

  // ── Connect to MongoDB ──
  await mongoose.connect(MONGO_URI)
  console.log('✅ Connected to MongoDB')

  let upserted = 0, modified = 0

  for (const rec of mapped) {
    const result = await YearlyStats.updateOne(
      { entityCode: rec.entityCode, year: rec.year },
      { $set: rec },
      { upsert: true }
    )
    if (result.upsertedCount > 0) upserted++
    else if (result.modifiedCount > 0) modified++
  }

  console.log(`\n✓ Upserted ${mapped.length} YearlyStats records across ${entities.length} entities (${yearRange})`)
  console.log(`  New: ${upserted} | Updated: ${modified} | Unchanged: ${mapped.length - upserted - modified}`)

  await mongoose.disconnect()
}

run().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
}).finally(() => {
  // Belt-and-suspenders clean exit
  setTimeout(() => process.exit(0), 200)
})
