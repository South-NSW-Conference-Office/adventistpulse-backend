/**
 * seed-lrp-body.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds the `body` field of every ResearchPaper document in MongoDB from
 * Finn's local LRP markdown files.
 *
 * The body is the markdown content AFTER the YAML frontmatter block.
 * Frontmatter (--- ... ---) is stripped before storing.
 *
 * Usage (run from bem-pulse-backend directory):
 *   node --experimental-vm-modules scripts/seed-lrp-body.js
 *   OR:  npm run seed:lrp-body
 *
 * The script reads LRP files from FINN_LRP_DIR (env or default path).
 * Idempotent — safe to re-run. Only updates docs where body is null/missing.
 * Pass --force to overwrite all bodies, even already-seeded ones.
 *
 * Env vars:
 *   FINN_LRP_DIR   Path to directory containing adventist-pulse-lrp-*.md files
 *                  Default: /Users/finbot/.openclaw/workspace
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectDB } from '../src/config/db.js'
import { ResearchPaper } from '../src/models/ResearchPaper.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Config ─────────────────────────────────────────────────────────────────────

const FINN_LRP_DIR = process.env.FINN_LRP_DIR || '/Users/finbot/.openclaw/workspace'
const FORCE = process.argv.includes('--force')

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Strip YAML frontmatter (--- ... ---) from markdown content.
 * Returns only the body text.
 */
function stripFrontmatter(content) {
  const trimmed = content.trimStart()
  if (!trimmed.startsWith('---')) return content

  // Find the closing ---
  const rest = trimmed.slice(3)
  const closeIdx = rest.indexOf('\n---')
  if (closeIdx === -1) return content // malformed — return as-is

  // Return everything after the closing ---\n
  const body = rest.slice(closeIdx + 4) // skip \n---
  return body.trimStart()
}

/**
 * Extract LRP ID from filename.
 * "adventist-pulse-lrp-042-hovering-ministers.md" → "LRP-042"
 */
function lrpIdFromFilename(filename) {
  const m = filename.match(/adventist-pulse-(lrp-(\d+))-/)
  if (!m) return null
  return `LRP-${m[2].padStart(3, '0')}`
}

/**
 * Return true if this filename is a "main" LRP file (not a -research, -rewrite-brief etc.)
 */
function isMainLrpFile(filename) {
  if (!filename.startsWith('adventist-pulse-lrp-')) return false
  if (!filename.endsWith('.md')) return false
  // Exclude auxiliary files
  const exclude = [
    '-research.md',
    '-rewrite-brief.md',
    '-rewritten.md',
    'lrp-expansion',
    'lrp-registry',
    'lrp-scorecard',
    'lrp-manifest',
    'lrp-content-library',
    'lrp-priority',
    'lrp-bias-review',
    'lrp-full-bias-review',
    'orphaned',
  ]
  return !exclude.some(x => filename.includes(x))
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔗 Connecting to MongoDB…')
  await connectDB()
  console.log('✅ Connected\n')

  // 1. Scan Finn's workspace for LRP markdown files
  let allFiles
  try {
    allFiles = fs.readdirSync(FINN_LRP_DIR)
  } catch (err) {
    console.error(`❌ Cannot read FINN_LRP_DIR: ${FINN_LRP_DIR}`)
    console.error(err.message)
    process.exit(1)
  }

  const lrpFiles = allFiles.filter(isMainLrpFile)
  console.log(`📁 Found ${lrpFiles.length} LRP markdown files in ${FINN_LRP_DIR}`)

  // Build map: LRP-ID → file path
  const fileMap = new Map()
  for (const filename of lrpFiles) {
    const id = lrpIdFromFilename(filename)
    if (id) {
      // If multiple files match the same ID (shouldn't happen for mains), keep first
      if (!fileMap.has(id)) {
        fileMap.set(id, path.join(FINN_LRP_DIR, filename))
      }
    }
  }

  console.log(`🗂  Mapped ${fileMap.size} unique LRP IDs\n`)

  // 2. Load all ResearchPaper docs from DB
  const filter = FORCE ? {} : { $or: [{ body: null }, { body: { $exists: false } }] }
  const papers = await ResearchPaper.find(filter, { id: 1, body: 1 }).lean()

  if (papers.length === 0) {
    console.log('✅ All papers already have body content. Use --force to re-seed.')
    await mongoose.disconnect()
    return
  }

  console.log(`📋 Papers to seed: ${papers.length}${FORCE ? ' (--force mode: overwriting all)' : ' (null body only)'}`)
  console.log()

  // 3. Seed body for each paper
  let seeded = 0
  let skipped = 0
  let notFound = 0

  for (const paper of papers) {
    const filePath = fileMap.get(paper.id)

    if (!filePath) {
      console.log(`  ⚠️  ${paper.id} — no markdown file found (skipping)`)
      notFound++
      continue
    }

    let raw
    try {
      raw = fs.readFileSync(filePath, 'utf-8')
    } catch (err) {
      console.log(`  ❌  ${paper.id} — read error: ${err.message}`)
      skipped++
      continue
    }

    const body = stripFrontmatter(raw)

    if (!body || body.trim().length < 50) {
      console.log(`  ⚠️  ${paper.id} — body too short after frontmatter strip (${body.length} chars), skipping`)
      skipped++
      continue
    }

    await ResearchPaper.updateOne(
      { id: paper.id },
      { $set: { body, bodyLength: body.length, wordCount: body.split(/\s+/).filter(Boolean).length } }
    )

    seeded++
    if (seeded % 20 === 0) {
      console.log(`  … ${seeded} seeded so far`)
    }
  }

  console.log('\n─────────────────────────────────────────────')
  console.log(`✅  Seeded:    ${seeded} papers`)
  console.log(`⏭️   Not found: ${notFound} papers (no markdown file)`)
  console.log(`⚠️   Skipped:   ${skipped} papers (read error / body too short)`)
  console.log('─────────────────────────────────────────────')

  await mongoose.disconnect()
  console.log('\n🔌 Disconnected. Done.')
}

main().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
