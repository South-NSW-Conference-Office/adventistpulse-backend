/**
 * migrate-json-to-mongo.js
 * ────────────────────────
 * Imports entities, yearly stats, and church geo data from frontend JSON files
 * into MongoDB.  Idempotent — safe to run multiple times (uses upserts).
 *
 * Usage:  npm run migrate
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../src/config/db.js'
import { Entity } from '../src/models/Entity.js'
import { YearlyStats } from '../src/models/YearlyStats.js'
import { OrgUnit } from '../src/models/OrgUnit.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Paths ──────────────────────────────────────────────────────────────────
const ENTITIES_PATH = path.resolve(__dirname, '../../frontend/public/data/entities.json')
const CHURCHES_PATH = path.resolve(__dirname, '../../frontend/public/data/au-churches-geocoded.json')

// ── Level mapping: JSON level → Entity schema enum ────────────────────────
const LEVEL_MAP = {
  gc:            'general_conference',
  general_conference: 'general_conference',
  division:      'division',
  union:         'union',
  union_conference: 'union_conference',
  union_mission: 'union_mission',
  conference:    'conference',
  mission:       'mission',
  field:         'field',
  field_station: 'field_station',
  section:       'section',
  attached_conference: 'attached_conference',
  attached_mission:    'attached_mission',
  attached_field:      'attached_field',
  attached_section:    'attached_section',
  gc_attached_union:   'gc_attached_union',
  gc_attached_field:   'gc_attached_field',
  union_of_churches_conference: 'union_of_churches_conference',
  union_of_churches_mission:    'union_of_churches_mission',
  union_section: 'union_section',
  region:        'region',
  mission_field: 'mission_field',
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Parse a value that may be "", null, a number, or a percentage string. */
function parseNum(v) {
  if (v === '' || v == null) return null
  if (typeof v === 'number') return v
  // Strip % and commas
  const cleaned = String(v).replace(/%/g, '').replace(/,/g, '').trim()
  if (cleaned === '') return null
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : null
}

/** Build the materialized path for an entity by walking up parent chain. */
function buildPath(code, entityMap) {
  const parts = []
  let cur = code
  const visited = new Set()
  while (cur) {
    if (visited.has(cur)) break // guard against cycles
    visited.add(cur)
    parts.unshift(cur)
    cur = entityMap[cur]?.parent ?? null
  }
  return parts.join('/')
}

/** Replicates stats.service.js #computeDerivedFields exactly. */
function computeDerivedFields(stat) {
  const m = stat.membership ?? {}
  if (Object.keys(m).length === 0) return stat

  const totalGains  = (m.baptisms ?? 0) + (m.professionOfFaith ?? 0) + (m.transfersIn ?? 0)
  const totalLosses = (m.deaths ?? 0) + (m.dropped ?? 0) + (m.missing ?? 0) + (m.transfersOut ?? 0)
  const netGrowth   = totalGains - totalLosses
  const growthRate  = m.beginning > 0 ? parseFloat((netGrowth / m.beginning).toFixed(6)) : null

  const dropped = m.dropped ?? 0
  const missing = m.missing ?? 0
  const baptisms = m.baptisms ?? 0
  const professionOfFaith = m.professionOfFaith ?? 0
  const totalAccessions = baptisms + professionOfFaith

  const retentionRate = m.beginning > 0
    ? parseFloat(((1 - ((dropped + missing) / m.beginning)) * 100).toFixed(6))
    : null
  const dropoutRate = m.beginning > 0
    ? parseFloat((((dropped + missing) / m.beginning) * 100).toFixed(6))
    : null
  const lossRate = m.beginning > 0
    ? parseFloat(((totalLosses / m.beginning) * 100).toFixed(6))
    : null
  const accessionRate = m.beginning > 0
    ? parseFloat(((totalAccessions / m.beginning) * 100).toFixed(6))
    : null

  // Derived cross-domain fields
  const w = stat.workers ?? {}
  const f = stat.finance ?? {}
  const ending = m.ending ?? 0
  const membersPerWorker = (w.totalWorkers && w.totalWorkers > 0 && ending > 0)
    ? parseFloat((ending / w.totalWorkers).toFixed(6))
    : null
  const tithePerCapita = (f.tithe != null && ending > 0)
    ? parseFloat((f.tithe / ending).toFixed(6))
    : null

  return {
    ...stat,
    membership: {
      ...m, totalGains, totalLosses, netGrowth, growthRate,
      retentionRate, dropoutRate, lossRate, accessionRate, totalAccessions,
    },
    derived: { membersPerWorker, tithePerCapita },
  }
}

// ── Entity Migration ───────────────────────────────────────────────────────
async function migrateEntities(entityMap) {
  const codes = Object.keys(entityMap)
  const total = codes.length
  let migrated = 0

  console.log(`\n── Migrating ${total} entities ──`)

  for (let i = 0; i < codes.length; i++) {
    const code = codes[i]
    const raw = entityMap[code]

    const level = LEVEL_MAP[raw.level]
    if (!level) {
      console.warn(`  ⚠ Skipping entity ${code}: unknown level "${raw.level}"`)
      continue
    }

    const entityPath = buildPath(code, entityMap)

    try {
      await Entity.findOneAndUpdate(
        { code },
        {
          code,
          name:       raw.name,
          level,
          parentCode: raw.parent || null,
          path:       entityPath,
          isActive:   true,
        },
        { upsert: true, new: true },
      )
      migrated++
      if ((i + 1) % 100 === 0 || i + 1 === total) {
        console.log(`  Migrated entity ${i + 1} of ${total}: ${code}`)
      }
    } catch (err) {
      console.error(`  ✗ Error migrating entity ${code}:`, err.message)
    }
  }

  // Second pass: set parentId ObjectId references
  console.log('  Setting parentId references…')
  const allEntities = await Entity.find({}, 'code _id').lean()
  const idByCode = Object.fromEntries(allEntities.map(e => [e.code, e._id]))

  for (const code of codes) {
    const parentCode = entityMap[code].parent
    if (!parentCode) continue
    const parentId = idByCode[parentCode]
    if (parentId) {
      await Entity.updateOne({ code }, { parentId })
    }
  }

  console.log(`  ✓ Entities: ${migrated} inserted/updated, ${total - migrated} skipped`)
  return migrated
}

// ── YearlyStats Migration ──────────────────────────────────────────────────
async function migrateYearlyStats(entityMap) {
  const codes = Object.keys(entityMap)
  let totalStats = 0
  let migrated = 0
  let skipped = 0

  // Count total year records
  for (const code of codes) {
    totalStats += (entityMap[code].years ?? []).length
  }

  console.log(`\n── Migrating ${totalStats} yearly stats records ──`)

  let count = 0
  for (const code of codes) {
    const years = entityMap[code].years ?? []

    for (const yr of years) {
      count++
      const year = parseNum(yr['Year'])
      if (year == null) { skipped++; continue }

      // Parse membership fields
      const baptisms          = parseNum(yr['Baptisms'])
      const formerMemberBapt  = parseNum(yr['Former Member Baptisms'])
      const totalBaptisms     = (baptisms ?? 0) + (formerMemberBapt ?? 0) || baptisms

      const beginning         = parseNum(yr['Beginning Membership'])
      const ending            = parseNum(yr['Ending Membership'])
      const professionOfFaith = parseNum(yr['Professions of Faith'])
      const transfersIn       = parseNum(yr['Transfers In'])
      const transfersOut      = parseNum(yr['Transfers Out'])
      const deaths            = parseNum(yr['Deaths'])
      const dropped           = parseNum(yr['Dropped'])
      const missing           = parseNum(yr['Missing'])
      const totalGains        = parseNum(yr['Total Gains'])
      const totalLosses       = parseNum(yr['Total Losses'])

      // Parse growth rate — could be "1.84%" or a decimal
      let growthRate = null
      const rawGR = yr['Growth Rate']
      if (rawGR != null && rawGR !== '') {
        const parsed = parseNum(rawGR)
        if (parsed != null) {
          // If it was a % string like "1.84%", parseNum stripped %, gave 1.84 → convert to decimal
          growthRate = String(rawGR).includes('%') ? parsed / 100 : (Math.abs(parsed) > 1 ? parsed / 100 : parsed)
        }
      }

      const netGrowth = parseNum(yr['Net Growth'])

      // Parse worker fields
      const ordainedMinisters    = parseNum(yr['Ordained Ministers'])
      const licensedMinisters    = parseNum(yr['Licensed Ministers'])
      const licensedMissionaries = null  // not in JSON
      const literatureEvangelists = null // not in JSON
      const totalWorkers = (ordainedMinisters ?? 0) + (licensedMinisters ?? 0)
        || null  // null if both are null/0

      // Build the stat object
      const stat = {
        year,
        churches:   parseNum(yr['Churches']),
        companies:  parseNum(yr['Companies']),
        membership: {
          beginning,
          ending,
          baptisms: totalBaptisms,
          professionOfFaith,
          transfersIn,
          transfersOut,
          deaths,
          dropped,
          missing,
          totalGains,
          totalLosses,
          netGrowth:  netGrowth ?? (beginning != null && ending != null ? ending - beginning : null),
          growthRate: growthRate ?? (beginning > 0 && ending != null ? parseFloat(((ending - beginning) / beginning).toFixed(6)) : null),
        },
        workers: {
          ordainedMinisters,
          licensedMinisters,
          licensedMissionaries,
          literatureEvangelists,
          totalWorkers: totalWorkers || null,
        },
        finance: {
          tithe:    null, // not in JSON
          offerings: null,
        },
        source: 'adventiststatistics.org',
      }

      // Compute derived fields using the same logic as stats.service.js
      const enriched = computeDerivedFields(stat)

      try {
        await YearlyStats.findOneAndUpdate(
          { entityCode: code, year },
          { entityCode: code, ...enriched },
          { upsert: true, new: true },
        )
        migrated++
      } catch (err) {
        console.error(`  ✗ Error migrating stats ${code}/${year}:`, err.message)
        skipped++
      }

      if (count % 5000 === 0) {
        console.log(`  Progress: ${count} of ${totalStats} stats processed…`)
      }
    }
  }

  console.log(`  ✓ Stats: ${migrated} inserted/updated, ${skipped} skipped`)
  return migrated
}

// ── Church Geo Data Migration (OrgUnit) ────────────────────────────────────
async function migrateChurches() {
  if (!fs.existsSync(CHURCHES_PATH)) {
    console.log('\n── Skipping church geo data: file not found ──')
    return 0
  }

  const raw = JSON.parse(fs.readFileSync(CHURCHES_PATH, 'utf-8'))
  const churches = raw.churches ?? []

  console.log(`\n── Migrating ${churches.length} churches to OrgUnit ──`)

  let migrated = 0
  let skipped = 0

  for (let i = 0; i < churches.length; i++) {
    const ch = churches[i]

    // Generate a stable code from name + conference
    const code = `${ch.conference}-${ch.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 30)}`

    const data = {
      code,
      name:       ch.name,
      level:      'church',
      parentCode: ch.conference || null,
      metadata: {
        region:  ch.state || null,
        country: 'AU',
      },
    }

    // Add geo coordinates if available
    if (ch.lat != null && ch.lng != null) {
      data.location = {
        type:        'Point',
        coordinates: [ch.lng, ch.lat], // GeoJSON: [lng, lat]
      }
    }

    try {
      await OrgUnit.findOneAndUpdate(
        { code },
        data,
        { upsert: true, new: true },
      )
      migrated++
    } catch (err) {
      console.error(`  ✗ Error migrating church "${ch.name}":`, err.message)
      skipped++
    }

    if ((i + 1) % 200 === 0 || i + 1 === churches.length) {
      console.log(`  Migrated church ${i + 1} of ${churches.length}: ${ch.name}`)
    }
  }

  console.log(`  ✓ Churches: ${migrated} inserted/updated, ${skipped} skipped`)
  return migrated
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  await connectDB()

  // Load entities JSON
  if (!fs.existsSync(ENTITIES_PATH)) {
    console.error(`entities.json not found at ${ENTITIES_PATH}`)
    process.exit(1)
  }
  const entityMap = JSON.parse(fs.readFileSync(ENTITIES_PATH, 'utf-8'))

  const entityCount = await migrateEntities(entityMap)
  const statsCount  = await migrateYearlyStats(entityMap)
  const churchCount = await migrateChurches()

  console.log('\n════════════════════════════════')
  console.log('  Migration complete')
  console.log(`  Entities:  ${entityCount} inserted/updated`)
  console.log(`  Stats:     ${statsCount} inserted/updated`)
  console.log(`  Churches:  ${churchCount} inserted/updated`)
  console.log('════════════════════════════════\n')

  await mongoose.disconnect()
  process.exit(0)
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
