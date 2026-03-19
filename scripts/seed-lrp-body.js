/**
 * seed-lrp-body.js
 * ─────────────────
 * Seeds body text into the ResearchPaper collection.
 * Body text is sourced from data/lrps-body-seed.json (208 papers).
 *
 * Safe to re-run — uses updateOne with $set, only sets body if non-empty.
 * Does NOT overwrite any other fields.
 *
 * Usage:  node scripts/seed-lrp-body.js
 *         npm run seed:lrp-body
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../src/config/db.js'
import { ResearchPaper } from '../src/models/ResearchPaper.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SEED_PATH = path.resolve(__dirname, '../data/lrps-body-seed.json')

async function main() {
  await connectDB()
  console.log('Connected to MongoDB')

  const seedData = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8'))
  console.log(`Seeding body text for ${seedData.length} research papers...`)

  let updated = 0
  let notFound = 0
  let skipped = 0

  for (const { id, body } of seedData) {
    if (!body || !body.trim()) { skipped++; continue }

    const result = await ResearchPaper.updateOne(
      { id },
      { $set: { body: body.trim() } }
    )

    if (result.matchedCount === 0) {
      notFound++
      console.warn(`  NOT FOUND: ${id}`)
    } else {
      updated++
    }
  }

  console.log(`\nDone.`)
  console.log(`  Updated: ${updated}`)
  console.log(`  Not found in DB: ${notFound} (run migrate-research.js first)`)
  console.log(`  Skipped (empty body): ${skipped}`)

  await mongoose.disconnect()
  process.exit(0)
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
