/**
 * migrate-entities-to-orgunits.js
 *
 * One-time migration: copies data from the `entities` collection (old schema)
 * into the `orgunits` collection (new OrgUnit model schema).
 *
 * Run on the production server:
 *   node scripts/migrate-entities-to-orgunits.js
 *
 * Safe to re-run — uses upsert on `code`.
 */

import mongoose from 'mongoose'
import dotenv   from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join }  from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI
if (!MONGO_URI) { console.error('MONGODB_URI not set'); process.exit(1) }

// ── Level mapping: old entity levels → OrgUnit levels ─────────────────────────
const LEVEL_MAP = {
  general_conference:           'gc',
  division:                     'division',
  union_conference:             'union',
  union_mission:                'union',
  union:                        'union',
  gc_attached_union:            'union',
  conference:                   'conference',
  mission:                      'conference',
  attached_conference:          'conference',
  attached_mission:             'conference',
  attached_field:               'conference',
  attached_section:             'conference',
  gc_attached_field:            'conference',
  gc_affiliated:                'conference',
  field:                        'conference',
  field_station:                'conference',
  section:                      'conference',
  union_of_churches_conference: 'conference',
  union_of_churches_mission:    'conference',
  union_section:                'conference',
  region:                       'conference',
  mission_field:                'conference',
  church:                       'church',
}

async function run() {
  await mongoose.connect(MONGO_URI)
  console.log('✅ Connected to MongoDB')

  const db = mongoose.connection.db

  // Load all entities
  const entities = await db.collection('entities').find({}).toArray()
  console.log(`📦 Found ${entities.length} docs in 'entities' collection`)

  if (entities.length === 0) {
    console.log('❌ No entities found — did you run seed-entities.js first?')
    process.exit(1)
  }

  // Build id → code map for parent resolution
  const idToCode = {}
  for (const e of entities) {
    if (e.code) idToCode[e._id.toString()] = e.code.toUpperCase()
  }

  let inserted = 0, updated = 0, skipped = 0

  for (const e of entities) {
    const newLevel = LEVEL_MAP[e.level]
    if (!newLevel) {
      console.warn(`⚠️  Unknown level '${e.level}' for ${e.code} — skipping`)
      skipped++
      continue
    }

    // Resolve parentCode from parentId ObjectId
    let parentCode = null
    if (e.parentId) {
      parentCode = idToCode[e.parentId.toString()] ?? null
    } else if (e.parentCode) {
      parentCode = e.parentCode.toUpperCase()
    }

    const doc = {
      code:       e.code?.toUpperCase(),
      name:       e.name,
      level:      newLevel,
      parentCode: parentCode,
      metadata: {
        region:   e.region ?? null,
        country:  e.country ?? e.metadata?.country ?? null,
        website:  e.website ?? null,
      },
      isActive: e.isActive ?? true,
      createdAt: e.createdAt ?? new Date(),
      updatedAt: new Date(),
    }

    if (!doc.code || !doc.name) {
      console.warn(`⚠️  Missing code or name — skipping doc _id=${e._id}`)
      skipped++
      continue
    }

    const result = await db.collection('orgunits').updateOne(
      { code: doc.code },
      { $set: doc },
      { upsert: true }
    )

    if (result.upsertedCount > 0) inserted++
    else if (result.modifiedCount > 0) updated++
  }

  const total = await db.collection('orgunits').countDocuments()
  console.log(`\n✅ Done — inserted=${inserted} updated=${updated} skipped=${skipped}`)
  console.log(`📊 orgunits collection now has ${total} documents`)
  await mongoose.disconnect()
}

run().catch(err => { console.error(err); process.exit(1) })
