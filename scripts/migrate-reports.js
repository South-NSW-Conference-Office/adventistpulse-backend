/**
 * migrate-reports.js
 * ──────────────────
 * Imports reports from frontend JSON files into MongoDB.
 * Idempotent — safe to run multiple times (uses upserts).
 *
 * Usage:  npm run migrate-reports
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../src/config/db.js'
import { Report } from '../src/models/Report.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const REPORTS_INDEX_PATH = path.resolve(__dirname, '../../frontend/public/data/reports-index.json')
const BRIEFS_PATH = path.resolve(__dirname, '../../frontend/public/data/briefs.json')

async function main() {
  await connectDB()
  console.log('Connected to MongoDB')

  const reportsIndex = JSON.parse(fs.readFileSync(REPORTS_INDEX_PATH, 'utf-8'))
  const briefsFull = JSON.parse(fs.readFileSync(BRIEFS_PATH, 'utf-8'))

  // Build a lookup map: normalised id → brief data
  const briefsMap = new Map()
  for (const b of briefsFull) {
    briefsMap.set(b.id.toLowerCase(), b)
  }

  let upserted = 0

  // ── 1. State of Adventism ────────────────────────────────────────────────
  const soa = reportsIndex.stateOfAdventism
  if (soa) {
    await Report.findOneAndUpdate(
      { slug: soa.slug },
      {
        slug: soa.slug,
        type: 'state-of-adventism',
        title: soa.title,
        subtitle: soa.subtitle,
        date: soa.date ? new Date(soa.date) : undefined,
        year: soa.year,
        readTime: soa.readTime,
      },
      { upsert: true, new: true },
    )
    upserted++
    console.log(`  ✓ state-of-adventism: ${soa.slug}`)
  }

  // ── 2. Vital Signs ──────────────────────────────────────────────────────
  const vitalSigns = reportsIndex.vitalSigns ?? []
  for (const vs of vitalSigns) {
    await Report.findOneAndUpdate(
      { slug: vs.slug },
      {
        slug: vs.slug,
        type: 'vital-signs',
        entityCode: vs.entityCode,
        entityName: vs.entityName,
        entityLevel: vs.level,
        parentCodes: vs.parentCodes ?? [],
        year: vs.year,
        date: vs.date ? new Date(vs.date) : undefined,
        summary: vs.summary,
      },
      { upsert: true, new: true },
    )
    upserted++
  }
  console.log(`  ✓ vital-signs: ${vitalSigns.length} upserted`)

  // ── 3. Briefs ────────────────────────────────────────────────────────────
  const briefsIndex = reportsIndex.briefs ?? []
  for (const bi of briefsIndex) {
    // Match by normalising: index slug "pb-001" → briefs.json id "PB-001"
    const full = briefsMap.get(bi.slug)

    const doc = {
      slug: bi.slug,
      type: 'brief',
      title: bi.title,
      subtitle: bi.subtitle,
      date: bi.date ? new Date(bi.date) : undefined,
      readTime: bi.readTime,
      tags: bi.tags ?? [],
      featured: bi.featured ?? false,
    }

    // Merge fields from briefs.json full content
    if (full) {
      doc.body = full.body ?? undefined
      doc.heroStat = full.heroStat ?? undefined
      doc.heroStatLabel = full.heroStatLabel ?? undefined
      doc.pullQuote = full.pullQuote ?? undefined
      doc.category = full.category ?? undefined
      doc.lrpSource = full.lrpSource ?? undefined
      doc.sourceNote = full.sourceNote ?? undefined
      doc.discussionPrompt = full.discussionPrompt ?? undefined
    }

    await Report.findOneAndUpdate(
      { slug: bi.slug },
      doc,
      { upsert: true, new: true },
    )
    upserted++
  }
  console.log(`  ✓ briefs: ${briefsIndex.length} upserted`)

  console.log(`\nDone — ${upserted} reports upserted total.`)
  await mongoose.disconnect()
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
