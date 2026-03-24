/**
 * migrateEntityLocations.js
 * ─────────────────────────
 * One-time migration: reads entity-locations.json from the frontend repo and
 * upserts lat/lng/displayName onto OrgUnit.location in MongoDB.
 *
 * After this runs, the frontend can call the entities API for coordinates
 * instead of serving the static JSON file.
 *
 * Usage:
 *   node scripts/migrateEntityLocations.js
 *   DRY_RUN=true node scripts/migrateEntityLocations.js
 *
 * Requires MONGODB_URI in environment or .env file.
 */

require('dotenv').config()
const { MongoClient } = require('mongodb')
const fs = require('fs')
const path = require('path')

const MONGO_URI = process.env.MONGODB_URI
if (!MONGO_URI) throw new Error('MONGODB_URI env var is required')

const DRY_RUN = process.env.DRY_RUN === 'true'

// Path to the frontend's entity-locations.json — adjust if needed
const LOCATIONS_FILE = path.resolve(
  __dirname,
  '../../adventistpulse-frontend/public/data/entity-locations.json'
)

async function main() {
  console.log(`=== Entity Locations Migration${DRY_RUN ? ' (DRY RUN)' : ''} ===`)

  if (!fs.existsSync(LOCATIONS_FILE)) {
    throw new Error(`entity-locations.json not found at: ${LOCATIONS_FILE}`)
  }

  const locations = JSON.parse(fs.readFileSync(LOCATIONS_FILE, 'utf8'))
  console.log(`Loaded ${locations.length} entries from entity-locations.json`)

  const client = new MongoClient(MONGO_URI)
  await client.connect()
  const db = client.db()

  let updated = 0
  let skipped = 0
  let notFound = 0
  const bulk = []

  for (const loc of locations) {
    if (!loc.code || loc.lat == null || loc.lng == null) {
      skipped++
      continue
    }

    const entity = await db.collection('orgunits').findOne(
      { code: loc.code.toUpperCase() },
      { projection: { _id: 1, 'location.coordinates': 1 } }
    )

    if (!entity) {
      notFound++
      console.warn(`  NOT FOUND: ${loc.code}`)
      continue
    }

    bulk.push({
      updateOne: {
        filter: { code: loc.code.toUpperCase() },
        update: {
          $set: {
            'location.type':        'Point',
            'location.coordinates': [loc.lng, loc.lat],  // GeoJSON: [lng, lat]
            'location.displayName': loc.display_name || null,
            'location.source':      'finn-audit',
            'location.verifiedAt':  new Date(),
          }
        }
      }
    })
    updated++
  }

  console.log(`\nTo update: ${updated} | Skipped (no coords): ${skipped} | Not in DB: ${notFound}`)

  if (DRY_RUN) {
    console.log('\nDRY RUN — no changes written.')
  } else if (bulk.length > 0) {
    const result = await db.collection('orgunits').bulkWrite(bulk, { ordered: false })
    console.log(`\n✅ Updated ${result.modifiedCount} OrgUnit documents with location data.`)
  }

  await client.close()
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
