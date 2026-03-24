/**
 * migrateEntityAliases.mjs
 * ------------------------
 * Populates aliases[], canonicalCode, and hiddenReason on OrgUnit documents
 * in production after the entity-aliases feature (PR #12) is deployed.
 *
 * Background:
 *   The PR adds the aliases index and fallback lookup to the schema/repo,
 *   but existing documents have empty aliases arrays. This script identifies
 *   duplicate OrgUnits representing the same real-world entity and:
 *     1. Sets aliases: [...oldCodes] on the canonical document
 *     2. Sets canonicalCode + hidden: true + hiddenReason on the duplicates
 *     3. Migrates any YearlyStats still on old codes to the canonical code
 *
 * Safety:
 *   - Idempotent: safe to re-run. Skips entities that already have a
 *     canonicalCode set (already processed).
 *   - Protected list is NEVER hidden regardless of duplication.
 *   - Dry-run mode: set DRY_RUN=true to preview without writing.
 *
 * Usage:
 *   node scripts/migrateEntityAliases.mjs
 *   DRY_RUN=true node scripts/migrateEntityAliases.mjs
 *
 * Requires MONGODB_URI in environment (or .env file in backend root).
 */

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'

// Load .env from backend root
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const dotenv = await import('dotenv')
dotenv.config({ path: path.join(__dirname, '..', '.env') })

import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGODB_URI
if (!MONGO_URI) throw new Error('MONGODB_URI env var is required')

const DRY_RUN = process.env.DRY_RUN === 'true'

// These codes are NEVER hidden — they are confirmed canonical entities
const PROTECTED = new Set([
  'GC',
  'ECD', 'SID', 'IAD', 'SAD', 'SSD', 'NAD', 'SUD', 'WAD', 'SPD', 'NSD', 'EUD', 'TED', 'ESD',
  'AUC', 'SNSW', 'NNSW', 'VIC', 'SAC', 'WAC', 'SQC', 'TAS', 'NAC', 'GSC',
])

/**
 * Determine the canonical code from a group of duplicate codes.
 * Priority: protected list > shorter code > not C-numeric (C10174) >
 *           not suffix-digit (MVG2) > most YearlyStats > alphabetical
 */
function selectCanonical(codes, statsCountMap) {
  for (const code of codes) {
    if (PROTECTED.has(code)) return code
  }

  const sorted = [...codes].sort((a, b) => {
    if (a.length !== b.length) return a.length - b.length
    const aNumeric = /^C\d+$/.test(a)
    const bNumeric = /^C\d+$/.test(b)
    if (aNumeric !== bNumeric) return aNumeric ? 1 : -1
    const aSuffix = /\d+$/.test(a)
    const bSuffix = /\d+$/.test(b)
    if (aSuffix !== bSuffix) return aSuffix ? 1 : -1
    const aStats = statsCountMap.get(a) || 0
    const bStats = statsCountMap.get(b) || 0
    if (aStats !== bStats) return bStats - aStats
    return a.localeCompare(b)
  })

  return sorted[0]
}

async function main() {
  const client = new MongoClient(MONGO_URI)
  await client.connect()
  const db = client.db()

  console.log(`=== Entity Aliases Migration${DRY_RUN ? ' (DRY RUN)' : ''} ===`)
  console.log(new Date().toISOString())

  const entities = await db.collection('orgunits').find(
    { hidden: { $ne: true } },
    { projection: { code: 1, name: 1, level: 1, aliases: 1, canonicalCode: 1 } }
  ).toArray()

  console.log(`Total visible entities: ${entities.length}`)

  const statsAgg = await db.collection('yearlystats').aggregate([
    { $group: { _id: '$entityCode', count: { $sum: 1 } } }
  ]).toArray()
  const statsCountMap = new Map(statsAgg.map(r => [r._id, r.count]))

  const normalise = (s) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : ''
  const groups = new Map()

  for (const e of entities) {
    if (!e.code || !e.name || !e.level) continue
    const key = `${e.level}:${normalise(e.name)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(e.code)
  }

  const duplicateGroups = [...groups.values()].filter(g => g.length > 1)
  console.log(`Duplicate groups found: ${duplicateGroups.length}`)

  let canonicalisedGroups = 0
  let entitiesHidden = 0
  let statsMigrated = 0
  const bulkOrgUnit = []
  const bulkStats = []

  for (const codes of duplicateGroups) {
    const canonical = selectCanonical(codes, statsCountMap)
    const aliases = codes.filter(c => c !== canonical)

    bulkOrgUnit.push({
      updateOne: {
        filter: { code: canonical },
        update: { $addToSet: { aliases: { $each: aliases } } }
      }
    })

    for (const alias of aliases) {
      if (PROTECTED.has(alias)) {
        console.warn(`  SKIP: ${alias} is protected — not hiding`)
        continue
      }
      bulkOrgUnit.push({
        updateOne: {
          filter: { code: alias },
          update: {
            $set: {
              hidden: true,
              canonicalCode: canonical,
              hiddenReason: `Duplicate — canonical is ${canonical}`
            }
          }
        }
      })
      entitiesHidden++

      const aliasStats = await db.collection('yearlystats').find(
        { entityCode: alias },
        { projection: { _id: 1, year: 1 } }
      ).toArray()

      for (const stat of aliasStats) {
        const existing = await db.collection('yearlystats').findOne({
          entityCode: canonical,
          year: stat.year
        })
        if (!existing) {
          bulkStats.push({
            updateOne: {
              filter: { _id: stat._id },
              update: { $set: { entityCode: canonical } }
            }
          })
          statsMigrated++
        }
      }
    }

    canonicalisedGroups++
  }

  console.log(`\nGroups to canonicalise: ${canonicalisedGroups}`)
  console.log(`Entities to hide: ${entitiesHidden}`)
  console.log(`YearlyStats records to migrate: ${statsMigrated}`)

  if (DRY_RUN) {
    console.log('\nDRY RUN — no changes written.')
  } else {
    if (bulkOrgUnit.length > 0) {
      const r1 = await db.collection('orgunits').bulkWrite(bulkOrgUnit, { ordered: false })
      console.log(`\n✅ OrgUnits updated: ${r1.modifiedCount}`)
    }
    if (bulkStats.length > 0) {
      const r2 = await db.collection('yearlystats').bulkWrite(bulkStats, { ordered: false })
      console.log(`✅ YearlyStats migrated: ${r2.modifiedCount}`)
    }
    console.log('\nMigration complete.')
  }

  await client.close()
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
