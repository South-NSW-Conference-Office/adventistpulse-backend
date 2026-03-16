/**
 * migrate-research.js
 * ───────────────────
 * Imports research papers from frontend JSON files into MongoDB.
 * Merges lrps.json (master, 208 entries) with research-index.json (182 entries).
 * Idempotent — safe to run multiple times (uses upserts).
 *
 * Usage:  npm run migrate-research
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../src/config/db.js'
import { ResearchPaper } from '../src/models/ResearchPaper.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const LRPS_PATH = path.resolve(__dirname, '../../frontend/public/data/lrps.json')
const INDEX_PATH = path.resolve(__dirname, '../../frontend/public/data/research-index.json')

const FEATURED_IDS = ['LRP-167', 'LRP-044', 'LRP-065']

async function main() {
  await connectDB()
  console.log('Connected to MongoDB')

  const lrps = JSON.parse(fs.readFileSync(LRPS_PATH, 'utf-8'))
  const indexData = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'))
  const indexPapers = indexData.research || []

  // Build lookup from research-index by id
  const indexMap = new Map()
  for (const paper of indexPapers) {
    indexMap.set(paper.id, paper)
  }

  // Collect all unique ids — lrps.json is master
  const allIds = new Set(lrps.map(p => p.id))
  for (const p of indexPapers) {
    allIds.add(p.id)
  }

  let upserted = 0

  for (const id of allIds) {
    const lrpData = lrps.find(p => p.id === id) || {}
    const indexEntry = indexMap.get(id) || {}

    // Start with lrps.json data, overlay missing fields from research-index
    const merged = { ...indexEntry, ...lrpData }

    const doc = {
      id: merged.id,
      title: merged.title,
      coreQuestion: merged.coreQuestion,
      status: merged.status,
      grade: merged.grade,
      score: merged.score ?? 0,
      confidence: merged.confidence,
      tags: merged.tags ?? [],
      regions: merged.regions ?? [],
      rootQuestions: merged.rootQuestions ?? [],
      sourceCount: merged.sourceCount ?? 0,
      primarySources: merged.primarySources ?? 0,
      wordCount: merged.wordCount ?? 0,
      bodyLength: merged.bodyLength ?? 0,
      lastUpdated: merged.lastUpdated ? new Date(merged.lastUpdated) : undefined,
      execSummary: merged.execSummary,
      keyFindings: merged.keyFindings ?? [],
      references: merged.references ?? [],
      qualityBreakdown: merged.qualityBreakdown ?? {},
      bibleReferences: merged.bibleReferences ?? [],
      australianRelevance: merged.australianRelevance,
      pulseNotesEnabled: merged.pulseNotesEnabled ?? false,
      parentLrp: merged.parentLrp ?? undefined,
      featured: FEATURED_IDS.includes(merged.id),
      file: merged.file,
      body: merged.body ?? undefined,
    }

    await ResearchPaper.findOneAndUpdate(
      { id: doc.id },
      doc,
      { upsert: true, new: true },
    )
    upserted++

    if (upserted % 50 === 0) {
      console.log(`  … ${upserted} papers upserted`)
    }
  }

  console.log(`\nDone — ${upserted} research papers upserted total.`)
  await mongoose.disconnect()
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
