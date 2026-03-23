/**
 * seedConferenceStats.js
 *
 * Seeds YearlyStats + OrgUnit records from Finn's adventiststatistics.org scrape.
 * Covers 1,121 entities (1,032 conferences + 89 unions) from 1863–2024.
 *
 * Source files:
 *   - all-conferences-stats.json    (15MB — keyed by entityCode, value = array of yearly records)
 *   - all-conference-entity-ids.json (445KB — keyed by entityCode, value = entity metadata)
 *
 * Usage:
 *   node scripts/seedConferenceStats.js              # write to DB (upsert safe)
 *   node scripts/seedConferenceStats.js --dry-run   # validate only, no writes
 *
 * Safe to re-run — uses upsert on { entityCode, year } / { code }.
 * Does NOT modify or delete any existing records.
 */

import mongoose from 'mongoose'
import dotenv   from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

// ── CLI args ──────────────────────────────────────────────────────────────────

const args   = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

// ── Source file paths ─────────────────────────────────────────────────────────

const STATS_FILE   = '/Users/jameswhite/.openclaw/workspace/projects/adventist-pulse-repo/data/raw/all-conferences-stats.json'
const IDS_FILE     = '/Users/jameswhite/.openclaw/workspace/projects/adventist-pulse-repo/data/raw/all-conference-entity-ids.json'

// ── MongoDB ───────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI
if (!MONGO_URI) { console.error('❌ MONGODB_URI not set in .env'); process.exit(1) }

// ── Inline YearlyStats schema (avoids import/transform issues in scripts) ─────

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

// ── Inline OrgUnit schema ─────────────────────────────────────────────────────

const orgUnitSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  level: {
    type: String,
    required: true,
    enum: ['gc', 'division', 'union', 'conference', 'church'],
  },
  parentCode: { type: String, default: null, uppercase: true },
  metadata: {
    region:      String,
    country:     String,
    established: Number,
    website:     String,
    emailDomain: String,
  },
  levelConfig: {
    conference: { type: Boolean, default: true },
    region:     { type: Boolean, default: false },
    district:   { type: Boolean, default: false },
  },
  levelLabels: {
    conference: { type: String, default: 'Conference' },
    region:     { type: String, default: 'Region' },
    district:   { type: String, default: 'District' },
    church:     { type: String, default: 'Church' },
  },
  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },
  },
}, { timestamps: true })

orgUnitSchema.index({ parentCode: 1, level: 1 })
orgUnitSchema.index({ level: 1 })
orgUnitSchema.index({ location: '2dsphere' }, { sparse: true })

const OrgUnit = mongoose.model('OrgUnit', orgUnitSchema)

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Determine OrgUnit level from the entity fieldID prefix.
 * Prefixes from Finn's scrape:
 *   D_ / D  → division
 *   U_ / U  → union
 *   C_ / C  → conference (field/mission/conference)
 */
function inferLevel(fieldID) {
  if (!fieldID) return 'conference'
  const upper = fieldID.toUpperCase()
  if (upper.startsWith('D_') || /^D\d/.test(upper)) return 'division'
  if (upper.startsWith('U_') || /^U\d/.test(upper)) return 'union'
  return 'conference'
}

/** Coerce to number or null. Rejects NaN and non-finite values. */
function num(v) {
  if (v == null || v === '' || v === '-') return null
  const n = Number(v)
  return isFinite(n) ? n : null
}

/**
 * Map one raw yearly record (from all-conferences-stats.json) to a YearlyStats document.
 * The entityCode comes from the outer key in the JSON.
 */
function mapYearlyRecord(entityCode, raw) {
  return {
    entityCode: entityCode.toUpperCase(),
    year:       Number(raw['Year']),
    churches:   num(raw['Churches']),
    companies:  num(raw['Companies']),
    membership: {
      beginning:         num(raw['Beginning Membership']),
      ending:            num(raw['Ending Membership']),
      baptisms:          num(raw['Baptisms']),
      professionOfFaith: num(raw['Professions of Faith']),
      transfersIn:       num(raw['Transfers In']),
      transfersOut:      num(raw['Transfers Out']),
      deaths:            num(raw['Deaths']),
      dropped:           num(raw['Dropped']),
      missing:           num(raw['Missing']),
      totalGains:        num(raw['Total Gains']),
      totalLosses:       num(raw['Total Losses']),
      netGrowth:         num(raw['Net Growth']),
      // growthRate computed in a second pass below
    },
    source:    'adventiststatistics.org',
    sourceUrl: `https://www.adventiststatistics.org/view_Summary.asp?FieldID=${entityCode}`,
    verified:  false,
  }
}

/**
 * Compute growthRate for each record where we have consecutive years.
 * growthRate = ((ending_this - ending_prior) / ending_prior) * 100
 */
function computeGrowthRates(records) {
  // records is already sorted by year (ascending) for one entity
  for (let i = 1; i < records.length; i++) {
    const prior   = records[i - 1].membership?.ending
    const current = records[i].membership?.ending
    if (prior != null && prior > 0 && current != null) {
      records[i].membership.growthRate = +((( current - prior) / prior) * 100).toFixed(4)
    }
  }
}

/**
 * Map entity metadata from all-conference-entity-ids.json to an OrgUnit document.
 */
function mapOrgUnit(entityCode, meta) {
  const level = inferLevel(meta.fieldID || entityCode)

  // parentCode: use fieldID-style code if we have it — otherwise null
  // The parentName is available but parentCode may need to be looked up separately.
  // We store parentName in metadata.region for now; parentCode set to null unless found.
  const parentCode = null  // parentInstID doesn't map to a fieldID — leave for future enrichment

  return {
    code:       entityCode.toUpperCase(),
    name:       meta.name || entityCode,
    level,
    parentCode,
    metadata: {
      region: meta.division   || null,   // e.g. "ECD", "NAD"
      country: null,                     // not in source data
      established: null,                 // not reliably available
    },
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  // ── Load source files ──
  console.log('📂 Loading source files...')

  let statsData, idsData
  try {
    statsData = JSON.parse(readFileSync(STATS_FILE, 'utf8'))
    console.log(`   ✓ Stats file loaded (${Object.keys(statsData).length} entities)`)
  } catch (err) {
    console.error(`❌ Could not read stats file: ${err.message}`)
    process.exit(1)
  }

  try {
    idsData = JSON.parse(readFileSync(IDS_FILE, 'utf8'))
    console.log(`   ✓ IDs file loaded (${Object.keys(idsData).length} entities)`)
  } catch (err) {
    console.error(`❌ Could not read IDs file: ${err.message}`)
    process.exit(1)
  }

  // ── Map all yearly stats records ──
  console.log('\n📊 Mapping yearly stats records...')
  const entityCodes     = Object.keys(statsData)
  const byEntity        = {}   // entityCode → sorted array of mapped records
  let   totalRawRecords = 0

  for (const entityCode of entityCodes) {
    const yearlyArray = statsData[entityCode]
    if (!Array.isArray(yearlyArray) || yearlyArray.length === 0) continue

    const mapped = yearlyArray
      .filter(r => r['Year'] != null && Number.isFinite(Number(r['Year'])))
      .map(r => mapYearlyRecord(entityCode, r))
      .sort((a, b) => a.year - b.year)

    if (mapped.length === 0) continue
    computeGrowthRates(mapped)

    byEntity[entityCode.toUpperCase()] = mapped
    totalRawRecords += mapped.length
  }

  const mappedEntities = Object.keys(byEntity)
  const allMapped      = Object.values(byEntity).flat()
  const years          = [...new Set(allMapped.map(r => r.year))].sort((a, b) => a - b)
  const yearRange      = `${years[0]}–${years[years.length - 1]}`

  console.log(`   ✓ ${totalRawRecords} records across ${mappedEntities.length} entities (${yearRange})`)

  // ── Map OrgUnit records ──
  console.log('\n🏛️  Mapping OrgUnit records...')
  const orgUnits = []
  for (const entityCode of mappedEntities) {
    const meta = idsData[entityCode] || idsData[entityCode.toLowerCase()] || {}
    orgUnits.push(mapOrgUnit(entityCode, meta))
  }

  // Group by level for reporting
  const levelCounts = orgUnits.reduce((acc, u) => {
    acc[u.level] = (acc[u.level] || 0) + 1
    return acc
  }, {})
  console.log('   Level breakdown:', levelCounts)

  if (dryRun) {
    console.log('\n🔍 DRY RUN — no database writes')
    console.log(`   YearlyStats records : ${allMapped.length}`)
    console.log(`   OrgUnit records     : ${orgUnits.length}`)
    console.log(`   Year range          : ${yearRange}`)
    // Sample record
    const sample = allMapped.find(r => r.membership?.growthRate != null)
    if (sample) {
      console.log('\nSample YearlyStats record (with growthRate):')
      console.log(JSON.stringify(sample, null, 2))
    }
    console.log('\nSample OrgUnit record:')
    console.log(JSON.stringify(orgUnits[0], null, 2))
    console.log(`\n✓ Dry run complete — ${allMapped.length} YearlyStats + ${orgUnits.length} OrgUnit records ready to upsert`)
    process.exit(0)
  }

  // ── Connect to MongoDB ──
  await mongoose.connect(MONGO_URI)
  console.log('\n✅ Connected to MongoDB')

  // ── Upsert YearlyStats (batched bulkWrite, 500 ops per batch) ─────────────
  const STATS_BATCH = 500
  console.log(`\n⬆️  Upserting ${allMapped.length} YearlyStats records (batches of ${STATS_BATCH})...`)
  let statsUpserted = 0, statsModified = 0, statsUnchanged = 0, statsErrors = 0

  for (let i = 0; i < allMapped.length; i += STATS_BATCH) {
    const batch = allMapped.slice(i, i + STATS_BATCH)
    const ops   = batch.map(rec => ({
      updateOne: {
        filter: { entityCode: rec.entityCode, year: rec.year },
        update: { $set: rec },
        upsert: true,
      }
    }))
    try {
      const result = await YearlyStats.bulkWrite(ops, { ordered: false })
      statsUpserted  += result.upsertedCount  || 0
      statsModified  += result.modifiedCount  || 0
      statsUnchanged += batch.length - (result.upsertedCount || 0) - (result.modifiedCount || 0)
    } catch (err) {
      // BulkWriteError may have partial results
      if (err.result) {
        statsUpserted  += err.result.nUpserted  || 0
        statsModified  += err.result.nModified  || 0
      }
      statsErrors += batch.length
      console.error(`   ⚠️  Batch error at ${i}–${i + batch.length}: ${err.message}`)
    }

    const done = Math.min(i + STATS_BATCH, allMapped.length)
    if (done % 5000 === 0 || done === allMapped.length) {
      console.log(`   ... ${done}/${allMapped.length} (new:${statsUpserted} updated:${statsModified} unchanged:${statsUnchanged})`)
    }
  }

  console.log(`\n✓ YearlyStats complete:`)
  console.log(`   New      : ${statsUpserted}`)
  console.log(`   Updated  : ${statsModified}`)
  console.log(`   Unchanged: ${statsUnchanged}`)
  if (statsErrors > 0) console.log(`   Errors   : ${statsErrors}`)

  // ── Upsert OrgUnits (single bulkWrite via raw collection) ───────────────
  // We use the raw MongoDB collection to bypass mongoose schema defaults,
  // specifically the `location: { type: 'Point' }` default which produces
  // invalid 2dsphere documents when no coordinates are provided.
  console.log(`\n⬆️  Upserting ${orgUnits.length} OrgUnit records...`)

  // Also fix any existing OrgUnit docs that have the bad location default
  // (could have been inserted by a previous partial run)
  const coll = mongoose.connection.collection('orgunits')
  try {
    const fixResult = await coll.updateMany(
      { 'location.type': 'Point', 'location.coordinates': { $exists: false } },
      { $unset: { location: '' } }
    )
    if (fixResult.modifiedCount > 0) {
      console.log(`   🔧 Fixed ${fixResult.modifiedCount} OrgUnit docs with invalid location default`)
    }
  } catch (fixErr) {
    console.warn(`   ⚠️  Could not fix invalid location docs: ${fixErr.message}`)
  }

  const orgOps = orgUnits.map(unit => ({
    updateOne: {
      filter: { code: unit.code },
      update: {
        $setOnInsert: { name: unit.name, level: unit.level, parentCode: null },
        $set: { 'metadata.region': unit.metadata.region },
        // Explicitly unset location to prevent 2dsphere index errors on insert
        $unset: {},
      },
      upsert: true,
    }
  }))

  let orgUpserted = 0, orgModified = 0, orgSkipped = 0, orgErrors = 0
  try {
    // Use raw collection bulkWrite to bypass mongoose schema defaults
    const result = await coll.bulkWrite(orgOps, { ordered: false })
    orgUpserted = result.upsertedCount || 0
    orgModified = result.modifiedCount || 0
    orgSkipped  = orgUnits.length - orgUpserted - orgModified
  } catch (err) {
    if (err.result) {
      orgUpserted = err.result.nUpserted || 0
      orgModified = err.result.nModified || 0
    }
    orgErrors = orgUnits.length
    console.error(`   ⚠️  OrgUnit bulkWrite error: ${err.message}`)
  }

  console.log(`\n✓ OrgUnit complete:`)
  console.log(`   New      : ${orgUpserted}`)
  console.log(`   Updated  : ${orgModified}`)
  console.log(`   Skipped  : ${orgSkipped}`)
  if (orgErrors > 0) console.log(`   Errors   : ${orgErrors}`)

  // ── Final summary ─────────────────────────────────────────────────────────
  console.log(`\n🎉 Seed complete!`)
  console.log(`   ${allMapped.length} YearlyStats records across ${mappedEntities.length} entities (${yearRange})`)
  console.log(`   ${orgUnits.length} OrgUnit records`)

  await mongoose.disconnect()
}

run().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
}).finally(() => {
  setTimeout(() => process.exit(0), 200)
})
