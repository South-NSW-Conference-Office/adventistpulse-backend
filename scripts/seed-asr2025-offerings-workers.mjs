/**
 * Seed script: ASR 2025 — Offerings & Workers by Division, plus GC Global Totals
 * Source: GC Annual Statistical Report 2025 (data year: 2024)
 * Run: node scripts/seed-asr2025-offerings-workers.mjs
 *
 * What this seeds:
 *  - finance.offerings per division (all 12 divisions)
 *  - workers.ordainedMinisters (all ordained, Table 23 Ministerial Credential FT)
 *  - workers.licensedMinisters (all licensed, Table 23 Ministerial License FT)
 *  - GC OrgUnit (if missing) + GC YearlyStats 2024 (global totals)
 *
 * Notes:
 *  - Division tithe was already seeded — we use $set so it won't overwrite.
 *  - All finance figures in USD.
 *  - Ordained = includes admin/institutional (Table 23 world total: 22,747)
 *  - Licensed = Table 23 Ministerial License FT (world total: 22,747 in col 1;
 *    licensed is different column — see notes in code)
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const MONGO_URI = process.env.MONGODB_URI
if (!MONGO_URI) throw new Error('MONGODB_URI environment variable is required. Set it in .env or pass it explicitly.')

// ─── Schema definitions (inline to avoid import issues) ───────────────────────

const orgUnitSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  level: { type: String, required: true, enum: ['gc', 'division', 'union', 'conference', 'church'] },
  parentCode: { type: String, default: null, uppercase: true },
}, { timestamps: true })

const yearlyStatsSchema = new mongoose.Schema({
  entityCode: { type: String, required: true, uppercase: true, trim: true },
  year: { type: Number, required: true },
  churches: Number,
  companies: Number,
  membership: {
    beginning: Number, ending: Number, baptisms: Number,
    totalAccessions: Number,
  },
  workers: {
    ordainedMinisters: Number,
    licensedMinisters: Number,
    licensedMissionaries: Number,
    literatureEvangelists: Number,
    totalWorkers: Number,
  },
  finance: {
    tithe: Number,
    titheCurrency: { type: String, default: 'USD' },
    offerings: Number,
  },
  derived: { membersPerWorker: Number, tithePerCapita: Number },
  source: { type: String, default: 'adventiststatistics.org' },
  sourceUrl: String,
  verified: { type: Boolean, default: false },
}, { timestamps: true })
yearlyStatsSchema.index({ entityCode: 1, year: 1 }, { unique: true })

// ─── Data extracted from ASR 2025 (year 2024) ─────────────────────────────────
//
// Columns confirmed from WORLD SUMMARY of Table 27 (Tithe and Offerings):
//   Total Tithe and Offerings verified: sum = 4,337,030,652 (matches world total ✓)
//   Offerings = Total T&O - Tithe
//
// Workers:
//   ordainedMinisters = Table 22 / Table 23 "Ministerial Credential FT"
//     (pastoral ordained only, world total = 17,841)
//   licensedMinisters = Table 23 / Table 28 col 25b (world total = 22,747)
//
const DIVISIONS = [
  {
    code: 'ECD',
    name: 'East-Central Africa Division',
    tithe:     73_406_748,
    totalTnO:  97_432_569,
    ordainedMinisters: 2354,   // Table 22 Ordained FT pastoral
    licensedMinisters: 2643,   // Table 28 col 25b / Table 23 License FT
  },
  {
    code: 'EAD',
    name: 'Euro-Asia Division',
    tithe:     20_637_072,
    totalTnO:  22_909_524,
    ordainedMinisters: 295,
    licensedMinisters: 387,
  },
  {
    code: 'IAD',
    name: 'Inter-American Division',
    tithe:    363_534_215,
    totalTnO: 499_276_455,
    ordainedMinisters: 1850,
    licensedMinisters: 2478,
  },
  {
    code: 'EUD',
    name: 'Inter-European Division',
    tithe:    166_796_573,
    totalTnO: 180_725_644,
    ordainedMinisters: 597,
    licensedMinisters: 949,
  },
  {
    code: 'NAD',
    name: 'North American Division',
    tithe:  1_298_178_252,
    totalTnO: 2_029_736_455,
    ordainedMinisters: 2938,
    licensedMinisters: 3461,
  },
  {
    code: 'NSD',
    name: 'Northern Asia-Pacific Division',
    tithe:     73_912_564,
    totalTnO: 107_856_893,
    ordainedMinisters: 781,
    licensedMinisters: 956,
  },
  {
    code: 'SAD',
    name: 'South American Division',
    tithe:    603_569_255,
    totalTnO: 830_689_765,
    ordainedMinisters: 2986,
    licensedMinisters: 4045,
  },
  {
    code: 'SPD',
    name: 'South Pacific Division',
    tithe:    118_726_049,
    totalTnO: 162_460_130,
    ordainedMinisters: 981,
    licensedMinisters: 1127,
  },
  {
    code: 'SID',
    name: 'Southern Africa-Indian Ocean Division',
    tithe:     83_948_334,
    totalTnO: 104_025_094,
    ordainedMinisters: 1227,
    licensedMinisters: 1486,
  },
  {
    code: 'SUD',
    name: 'Southern Asia Division',
    tithe:     12_238_269,
    totalTnO:  13_202_673,
    ordainedMinisters: 545,
    licensedMinisters: 807,
  },
  {
    code: 'SSD',
    name: 'Southern Asia-Pacific Division',
    tithe:    110_384_246,
    totalTnO: 140_114_973,
    ordainedMinisters: 1400,
    licensedMinisters: 2005,
  },
  {
    code: 'TED',
    name: 'Trans-European Division',
    tithe:     81_003_090,
    totalTnO:  92_767_457,
    ordainedMinisters: 327,
    licensedMinisters: 431,
  },
  {
    code: 'WAD',
    name: 'West-Central Africa Division',
    tithe:     20_505_963,
    totalTnO:  28_033_616,
    ordainedMinisters: 1159,
    licensedMinisters: 1334,
  },
]

// GC Global Totals 2024
// Membership: Table 4/6 world total ending 2024
// Baptisms: Table 3 total accessions 2024 (all modes)
// Churches: Table 26 world total 2024 first column
// Tithe, Offerings: Table 27 WORLD TOTALS 2024
const GC_TOTALS = {
  membership:  23_684_237,
  baptisms:     1_887_387,   // total accessions (all modes of joining)
  churches:       103_869,   // organized churches world total 2024
  companies:       77_753,   // church companies 2024
  tithe:    3_050_041_066,
  offerings: 1_286_989_586,  // Total T&O (4,337,030,652) - Tithe
}

// Verify our totals sum correctly
const divTitheSum = DIVISIONS.reduce((s, d) => s + d.tithe, 0)
const divTnOSum   = DIVISIONS.reduce((s, d) => s + d.totalTnO, 0)
// GC org itself + attached fields = 
//   GC own: 746,180 tithe / 2,799,836 T&O
//   CUM: 3,537,565 / 3,751,141
//   MENA: 5,242,180 / 5,994,523
//   UUC: 12,692,762 / 14,150,628
//   IF: 981,749 / 1,103,276
const GC_OWN_AND_ATTACHED_TITHE = 746_180 + 3_537_565 + 5_242_180 + 12_692_762 + 981_749
const GC_OWN_AND_ATTACHED_TNO   = 2_799_836 + 3_751_141 + 5_994_523 + 14_150_628 + 1_103_276
const expectedTotal = divTitheSum + GC_OWN_AND_ATTACHED_TITHE
const expectedTnO   = divTnOSum + GC_OWN_AND_ATTACHED_TNO

console.log('\n📊 Pre-seed verification:')
console.log(`  Division tithe sum: $${divTitheSum.toLocaleString()}`)
console.log(`  + GC/attached tithe: $${GC_OWN_AND_ATTACHED_TITHE.toLocaleString()}`)
console.log(`  = Total: $${expectedTotal.toLocaleString()} (expected: $${GC_TOTALS.tithe.toLocaleString()})`)
console.log(`  Match: ${expectedTotal === GC_TOTALS.tithe ? '✅' : '❌ MISMATCH'}`)
console.log()
console.log(`  Division T&O sum: $${divTnOSum.toLocaleString()}`)
console.log(`  + GC/attached T&O: $${GC_OWN_AND_ATTACHED_TNO.toLocaleString()}`)
const totalTnO = divTnOSum + GC_OWN_AND_ATTACHED_TNO
console.log(`  = Total: $${totalTnO.toLocaleString()} (expected: $${(GC_TOTALS.tithe + GC_TOTALS.offerings).toLocaleString()})`)
console.log(`  Match: ${totalTnO === GC_TOTALS.tithe + GC_TOTALS.offerings ? '✅' : '❌ MISMATCH'}`)

async function run() {
  await mongoose.connect(MONGO_URI)
  console.log('\n✅ Connected to MongoDB')

  const OrgUnit = mongoose.model('OrgUnit', orgUnitSchema)
  const YearlyStats = mongoose.model('YearlyStats', yearlyStatsSchema)

  // ─── 1. Ensure GC OrgUnit exists ──────────────────────────────────────────
  let gcOrg = await OrgUnit.findOne({ code: 'GC' })
  if (!gcOrg) {
    gcOrg = await OrgUnit.create({
      code: 'GC',
      name: 'General Conference of Seventh-day Adventists',
      level: 'gc',
      parentCode: null,
    })
    console.log('  ✅ Created GC OrgUnit')
  } else {
    console.log('  ✓  GC OrgUnit already exists')
  }

  // ─── 2. Upsert GC YearlyStats 2024 ───────────────────────────────────────
  const gcResult = await YearlyStats.findOneAndUpdate(
    { entityCode: 'GC', year: 2024 },
    {
      $set: {
        entityCode: 'GC',
        year: 2024,
        churches: GC_TOTALS.churches,
        companies: GC_TOTALS.companies,
        'membership.ending': GC_TOTALS.membership,
        'membership.totalAccessions': GC_TOTALS.baptisms,
        'finance.tithe': GC_TOTALS.tithe,
        'finance.offerings': GC_TOTALS.offerings,
        'finance.titheCurrency': 'USD',
        source: 'adventiststatistics.org',
        sourceUrl: 'https://www.adventiststatistics.org',
        verified: true,
      }
    },
    { upsert: true, new: true }
  )
  console.log(`  ✅ GC 2024: membership=${GC_TOTALS.membership.toLocaleString()}, tithe=$${GC_TOTALS.tithe.toLocaleString()}, offerings=$${GC_TOTALS.offerings.toLocaleString()}`)

  // ─── 3. Update each division with offerings + workers ─────────────────────
  let updated = 0, skipped = 0
  for (const div of DIVISIONS) {
    const offerings = div.totalTnO - div.tithe

    const existing = await YearlyStats.findOne({ entityCode: div.code, year: 2024 })
    if (!existing) {
      // Create a new record if it doesn't exist (shouldn't happen if tithe was seeded)
      await YearlyStats.create({
        entityCode: div.code,
        year: 2024,
        'finance.tithe': div.tithe,
        'finance.offerings': offerings,
        'finance.titheCurrency': 'USD',
        'workers.ordainedMinisters': div.ordainedMinisters,
        'workers.licensedMinisters': div.licensedMinisters,
        source: 'adventiststatistics.org',
        sourceUrl: 'https://www.adventiststatistics.org',
        verified: true,
      })
      console.log(`  ✅ ${div.code}: CREATED (offerings=$${offerings.toLocaleString()}, ordained=${div.ordainedMinisters}, licensed=${div.licensedMinisters})`)
      updated++
    } else {
      // Update offerings + workers
      await YearlyStats.updateOne(
        { entityCode: div.code, year: 2024 },
        {
          $set: {
            'finance.offerings': offerings,
            'finance.titheCurrency': 'USD',
            'workers.ordainedMinisters': div.ordainedMinisters,
            'workers.licensedMinisters': div.licensedMinisters,
            source: 'adventiststatistics.org',
            sourceUrl: 'https://www.adventiststatistics.org',
            verified: true,
          }
        }
      )
      console.log(`  ✅ ${div.code}: offerings=$${offerings.toLocaleString()}, ordained=${div.ordainedMinisters}, licensed=${div.licensedMinisters}`)
      updated++
    }
  }

  console.log(`\n📊 Done: ${updated} divisions updated, ${skipped} skipped`)
  console.log('\n📋 Summary by division:')
  for (const div of DIVISIONS) {
    const offerings = div.totalTnO - div.tithe
    console.log(`  ${div.code}: tithe=$${div.tithe.toLocaleString()}, offerings=$${offerings.toLocaleString()}, total=$${div.totalTnO.toLocaleString()}`)
  }

  await mongoose.disconnect()
  console.log('\n✅ Disconnected from MongoDB')
}

run().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
