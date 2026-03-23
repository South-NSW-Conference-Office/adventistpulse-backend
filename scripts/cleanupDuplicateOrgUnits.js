/**
 * cleanupDuplicateOrgUnits.js
 *
 * Deletes OrgUnit records that:
 *   1. Have a code matching /^[UC][0-9]/ (U10xxx or C10xxx internal IDs from adventiststatistics.org)
 *   2. Have NO matching YearlyStats record for that code
 *
 * Safe: if a U10xxx/C10xxx code HAS YearlyStats it is kept.
 *
 * Usage:
 *   node --env-file=.env scripts/cleanupDuplicateOrgUnits.js --dry-run   (default)
 *   node --env-file=.env scripts/cleanupDuplicateOrgUnits.js --execute
 */

import mongoose from 'mongoose'
import { OrgUnit } from '../src/models/OrgUnit.js'
import { YearlyStats } from '../src/models/YearlyStats.js'

const args = process.argv.slice(2)
const execute = args.includes('--execute')
const dryRun = !execute

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL
  if (!mongoUri) {
    console.error('❌  No MONGO_URI or DATABASE_URL found in environment. Exiting.')
    process.exit(1)
  }

  console.log(`🔌  Connecting to MongoDB…`)
  await mongoose.connect(mongoUri)
  console.log(`✅  Connected.\n`)

  // ── Step 1: Total OrgUnit count before ───────────────────────────────────
  const totalBefore = await OrgUnit.countDocuments()
  console.log(`📊  Total OrgUnit records (before): ${totalBefore}`)

  // ── Step 2: Find all OrgUnits with U10xxx / C10xxx codes ─────────────────
  const candidateDocs = await OrgUnit.find(
    { code: { $regex: /^[UC][0-9]/ } },
    { code: 1 }
  ).lean()

  const candidateCodes = candidateDocs.map(d => d.code)
  console.log(`🔍  OrgUnit codes matching /^[UC][0-9]/: ${candidateCodes.length}`)

  if (candidateCodes.length === 0) {
    console.log('✨  Nothing to clean up — no U10xxx/C10xxx codes found.')
    await mongoose.disconnect()
    return
  }

  // ── Step 3: Find which of those codes have YearlyStats ───────────────────
  const statsWithCodes = await YearlyStats.distinct('entityCode', {
    entityCode: { $in: candidateCodes }
  })
  const codesWithStats = new Set(statsWithCodes)
  console.log(`📈  Of those, codes WITH YearlyStats (keep): ${codesWithStats.size}`)

  // ── Step 4: Build delete list ─────────────────────────────────────────────
  const codesToDelete = candidateCodes.filter(c => !codesWithStats.has(c))
  const codesToKeep   = candidateCodes.filter(c =>  codesWithStats.has(c))

  console.log(`\n🗑️   Codes to DELETE (no YearlyStats): ${codesToDelete.length}`)
  console.log(`✅  Codes to KEEP   (have YearlyStats): ${codesToKeep.length}`)

  if (codesToKeep.length > 0) {
    console.log(`\n  Kept codes (sample, max 20):`)
    codesToKeep.slice(0, 20).forEach(c => console.log(`    - ${c}`))
    if (codesToKeep.length > 20) console.log(`    … and ${codesToKeep.length - 20} more`)
  }

  if (codesToDelete.length === 0) {
    console.log('\n✨  Nothing to delete — all U10xxx/C10xxx codes have YearlyStats.')
    await mongoose.disconnect()
    return
  }

  if (dryRun) {
    console.log(`\n⚠️   DRY-RUN mode — no changes made.`)
    console.log(`    Re-run with --execute to actually delete ${codesToDelete.length} records.`)
    console.log(`\n  Sample codes that WOULD be deleted (max 30):`)
    codesToDelete.slice(0, 30).forEach(c => console.log(`    - ${c}`))
    if (codesToDelete.length > 30) console.log(`    … and ${codesToDelete.length - 30} more`)
  } else {
    // ── Step 5: Execute delete ─────────────────────────────────────────────
    console.log(`\n🚀  EXECUTE mode — deleting ${codesToDelete.length} OrgUnit records…`)
    const result = await OrgUnit.deleteMany({ code: { $in: codesToDelete } })
    console.log(`✅  Deleted: ${result.deletedCount} OrgUnit records.`)

    const totalAfter = await OrgUnit.countDocuments()
    console.log(`\n📊  Total OrgUnit records (after):  ${totalAfter}`)
    console.log(`📉  Reduction: ${totalBefore - totalAfter} records removed`)
  }

  await mongoose.disconnect()
  console.log('\n🔌  Disconnected. Done.')
}

main().catch(err => {
  console.error('❌  Fatal error:', err)
  process.exit(1)
})
