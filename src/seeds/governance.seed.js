/**
 * Governance Seed Script
 * ---------------------
 * Seeds known AU conference session data into the Session collection.
 *
 * Usage:
 *   node src/seeds/governance.seed.js
 *
 * Requires MONGODB_URI in environment (or .env file).
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import { Session } from '../models/Session.js'

const SESSIONS = [
  // ── SNSW (South New South Wales Conference) ──────────────────────────────
  {
    entityCode:          'SNSW',
    sessionNumber:       60,
    dateHeld:            new Date('2025-01-01'), // approximate — exact date TBD
    cycleLengthYears:    4,
    nextSessionEstimate: 'Est. 2029',
    electedLeader: {
      name:      'Justin Lawman',
      title:     'President',
      electedAt: new Date('2025-01-01'),
    },
    location: 'Canberra, ACT',
    source:   'Calvin (General Secretary, SNSW)',
    notes:    'Cycle updated from triennial to quadrennial in 2025 constitution revision',
  },

  // ── Victorian Conference ──────────────────────────────────────────────────
  {
    entityCode:          'VIC',
    dateHeld:            new Date('2025-09-01'), // September 2025 — exact date TBD
    cycleLengthYears:    4,
    nextSessionEstimate: 'Est. 2029',
    source:              'Public records',
  },

  // ── Australasian Union Conference ────────────────────────────────────────
  {
    entityCode:          'AUC',
    dateHeld:            new Date('2025-01-01'), // 2025 — exact date TBD
    cycleLengthYears:    5,
    nextSessionEstimate: 'Est. 2030',
    source:              'Public records',
  },

  // ── North New South Wales Conference ─────────────────────────────────────
  {
    entityCode:     'NNSW',
    sessionNumber:  59,
    dateHeld:       new Date('2023-09-01'), // September 2023 — exact date TBD
    source:         'Public records',
    notes:          'Next session TBD',
  },

  // ── South Queensland Conference ───────────────────────────────────────────
  {
    entityCode:    'SQ',
    sessionNumber: 77,
    dateHeld:      new Date('2022-08-01'), // August 2022 — exact date TBD
    source:        'Public records',
    notes:         'Next session TBD',
  },
]

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('❌  MONGODB_URI not set — aborting seed.')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log('✅  Connected to MongoDB')

  for (const data of SESSIONS) {
    // Upsert on entityCode + dateHeld so re-runs are idempotent
    await Session.findOneAndUpdate(
      { entityCode: data.entityCode, dateHeld: data.dateHeld },
      { $setOnInsert: data },
      { upsert: true, new: true },
    )
    console.log(`   → Seeded session for ${data.entityCode}`)
  }

  console.log('✅  Governance seed complete')
  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})
