/**
 * seed-entities.js
 * Populates the Entity collection from two source files:
 *   1. yearbook-entity-tree.json  → Divisions (17)
 *   2. entities.json              → Unions + Conferences/Missions/Fields (1,229)
 *
 * Run: node --experimental-vm-modules backend/scripts/seed-entities.js
 * Or:  cd backend && node scripts/seed-entities.js
 */

import mongoose from 'mongoose'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Config ────────────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGODB_URI ||
  '***MONGODB_URI_REDACTED***'

const YEARBOOK_PATH = resolve(__dirname, '../../../Downloads/Adventist-Pulse-feature-entity-pages/data/exports/yearbook-entity-tree.json')
const ENTITIES_PATH = resolve(__dirname, '../../../Downloads/Adventist-Pulse-feature-entity-pages/data/exports/entities.json')

// Resolve paths relative to /Users/macbookm2pro16inch
const HOME = '/Users/macbookm2pro16inch'
const yearbookPath = `${HOME}/Downloads/Adventist-Pulse-feature-entity-pages/data/exports/yearbook-entity-tree.json`
const entitiesPath = `${HOME}/Downloads/Adventist-Pulse-feature-entity-pages/data/exports/entities.json`

// ── Schema (inline — avoids circular import issues in scripts) ────────────────

const LEVELS = [
  'general_conference','division','union_conference','union_mission','union',
  'conference','mission','attached_conference','attached_mission','attached_field',
  'attached_section','gc_attached_union','gc_attached_field','field','field_station',
  'section','union_of_churches_conference','union_of_churches_mission',
  'union_section','region','mission_field',
]

const entitySchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  code:       { type: String, required: true, trim: true, unique: true },
  level:      { type: String, required: true, enum: LEVELS },
  parentCode: { type: String, default: null },
  parentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Entity', default: null },
  path:       { type: String, required: true, index: true },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true })

entitySchema.index({ code: 1 })
entitySchema.index({ parentCode: 1 })
entitySchema.index({ level: 1 })

const Entity = mongoose.model('Entity', entitySchema)

// ── Helpers ───────────────────────────────────────────────────────────────────

// Normalize level strings from entities.json to our enum
function normalizeLevel(raw) {
  if (!raw) return 'conference'
  const map = {
    union:        'union',
    conference:   'conference',
    mission:      'mission',
    field:        'field',
    section:      'section',
    field_station:'field_station',
  }
  return map[raw.toLowerCase()] ?? 'conference'
}

// Normalize level strings from yearbook tree
function normalizeYearbookLevel(raw) {
  const map = {
    general_conference:            'general_conference',
    division:                      'division',
    union_conference:              'union_conference',
    union_mission:                 'union_mission',
    attached_conference:           'attached_conference',
    attached_mission:              'attached_mission',
    attached_field:                'attached_field',
    attached_section:              'attached_section',
    gc_attached_union:             'gc_attached_union',
    gc_attached_field:             'gc_attached_field',
    field:                         'field',
    field_station:                 'field_station',
    union_of_churches_conference:  'union_of_churches_conference',
    union_of_churches_mission:     'union_of_churches_mission',
    union_section:                 'union_section',
    region:                        'region',
    mission_field:                 'mission_field',
  }
  return map[raw] ?? 'conference'
}

// ── Build flat list ───────────────────────────────────────────────────────────

function buildFromYearbook(yearbookData) {
  const docs = []

  // GC root
  const tree = yearbookData.tree
  docs.push({
    name:       tree.name,
    code:       'GC',
    level:      'general_conference',
    parentCode: null,
    path:       'GC',
    isActive:   true,
  })

  // Divisions + their attached fields (direct children of GC node)
  function walkDivisions(node, parentCode, parentPath) {
    const code = node.code
    const path = `${parentPath}/${code}`
    docs.push({
      name:       node.name,
      code,
      level:      normalizeYearbookLevel(node.level),
      parentCode,
      path,
      isActive:   true,
    })
    // Walk further only if children exist and we haven't gone past union level
    if (node.children) {
      node.children.forEach(child => {
        // Only walk one level deep from divisions (union level)
        // entities.json covers below that
        if (!['conference','mission','field','section'].includes(child.level)) {
          walkDivisions(child, code, path)
        }
      })
    }
  }

  if (tree.children) {
    tree.children.forEach(child => walkDivisions(child, 'GC', 'GC'))
  }

  return docs
}

function buildFromEntities(entitiesData) {
  const docs = []
  const entries = Object.values(entitiesData)

  entries.forEach(e => {
    const code = e.code
    const name = e.name

    // Skip if name is same as code (no real name)
    const isActive = name && name !== code

    const parentCode = e.parent || null

    docs.push({
      name:       name || code,
      code,
      level:      normalizeLevel(e.level),
      parentCode,
      path:       '__PENDING__', // resolved in pass 2
      isActive:   !!isActive,
    })
  })

  return docs
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Connecting to MongoDB…')
  await mongoose.connect(MONGO_URI)
  console.log('Connected.')

  // ── Load source files ──
  const yearbookData = JSON.parse(readFileSync(yearbookPath, 'utf8'))
  const entitiesData = JSON.parse(readFileSync(entitiesPath, 'utf8'))

  // ── Build doc lists ──
  const yearbookDocs = buildFromYearbook(yearbookData)
  const entityDocs   = buildFromEntities(entitiesData)

  console.log(`Yearbook docs: ${yearbookDocs.length}`)
  console.log(`Entity docs:   ${entityDocs.length}`)

  // ── Merge: yearbook takes priority (better level names) ──
  const merged = new Map()

  // entities.json first (lower priority)
  entityDocs.forEach(d => merged.set(d.code, d))

  // yearbook overwrites (higher priority) — but don't overwrite with union-level stubs
  // Only overwrite GC and division-level entries from yearbook
  yearbookDocs.forEach(d => {
    if (['general_conference','division'].includes(d.level) || !merged.has(d.code)) {
      merged.set(d.code, d)
    }
  })

  const allDocs = [...merged.values()]
  console.log(`Merged total: ${allDocs.length}`)

  // ── Build code → path map ──
  // We need to resolve paths for entities.json docs
  // Walk up parentCode chain to build path
  const codeMap = new Map(allDocs.map(d => [d.code, d]))

  function resolvePath(doc, visited = new Set()) {
    if (doc.path && doc.path !== '__PENDING__') return doc.path
    if (!doc.parentCode) {
      doc.path = doc.code
      return doc.path
    }
    if (visited.has(doc.code)) {
      // Circular reference guard
      doc.path = doc.code
      return doc.path
    }
    visited.add(doc.code)
    const parent = codeMap.get(doc.parentCode)
    if (!parent) {
      // Parent not found — use code only
      doc.path = doc.code
      return doc.path
    }
    const parentPath = resolvePath(parent, visited)
    doc.path = `${parentPath}/${doc.code}`
    return doc.path
  }

  allDocs.forEach(d => resolvePath(d))

  // ── Bulk upsert pass 1 (without parentId) ──
  console.log('\nBulk upserting entities (pass 1)…')
  const bulkOps = allDocs.map(doc => ({
    updateOne: {
      filter: { code: doc.code },
      update: {
        $set: {
          name:       doc.name,
          code:       doc.code,
          level:      doc.level,
          parentCode: doc.parentCode,
          path:       doc.path,
          isActive:   doc.isActive,
        },
      },
      upsert: true,
    },
  }))

  const result = await Entity.bulkWrite(bulkOps, { ordered: false })
  console.log(`  Upserted: ${result.upsertedCount} | Modified: ${result.modifiedCount}`)

  // ── Resolve parentId (pass 2 — bulk) ──
  console.log('\nResolving parentId references (pass 2)…')
  const allEntities = await Entity.find({}, { _id: 1, code: 1 }).lean()
  const idMap = new Map(allEntities.map(e => [e.code, e._id]))

  const parentOps = allDocs
    .filter(d => d.parentCode && idMap.has(d.parentCode))
    .map(d => ({
      updateOne: {
        filter: { code: d.code },
        update: { $set: { parentId: idMap.get(d.parentCode) } },
      },
    }))

  const result2 = await Entity.bulkWrite(parentOps, { ordered: false })
  console.log(`  Resolved ${result2.modifiedCount} parentId references.`)

  // ── Summary ──
  const total    = await Entity.countDocuments()
  const active   = await Entity.countDocuments({ isActive: true })
  const byLevel  = await Entity.aggregate([
    { $group: { _id: '$level', count: { $sum: 1 } } },
    { $sort:  { count: -1 } },
  ])

  console.log(`\n✅ Done. ${total} total entities (${active} active)`)
  console.log('\nBy level:')
  byLevel.forEach(({ _id, count }) => console.log(`  ${_id}: ${count}`))

  await mongoose.disconnect()
  console.log('\nDisconnected.')
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
