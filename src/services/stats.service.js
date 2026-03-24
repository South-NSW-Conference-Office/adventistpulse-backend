/**
 * stats.service.js — Computed stats aggregations.
 *
 * Builds expensive country-level datasets from YearlyStats + OrgUnit,
 * stores results in ComputedStats, and serves cached results.
 *
 * Design principles:
 *   SRP — this service owns computation logic only; persistence is in ComputedStats.
 *   OCP — add new computed stats keys without touching existing ones.
 *   DRY — all country-level queries go through getCountryEntities().
 *
 * Staleness TTL defaults:
 *   country-growth      — 24 hours (membership data changes nightly)
 *   country-membership  — 24 hours
 */

import { OrgUnit }        from '../models/OrgUnit.js'
import { YearlyStats }    from '../models/YearlyStats.js'
import { ComputedStats }  from '../models/ComputedStats.js'
import { logger }         from '../core/logger.js'

const TTL_MS = 24 * 60 * 60 * 1000  // 24 hours

// ── Shared helpers ────────────────────────────────────────────────────────────

/**
 * Get all visible entities that have a metadata.country set.
 * These are the building blocks for all country-level aggregations.
 * @returns {Promise<object[]>} Lean OrgUnit documents
 */
async function getCountryEntities() {
  return OrgUnit.find(
    {
      hidden:             { $ne: true },
      'metadata.country': { $exists: true, $nin: [null, '', '__EXCLUDE__'] },
    },
    { code: 1, name: 1, level: 1, parentCode: 1, 'metadata.country': 1, location: 1 },
  ).lean()
}

/**
 * Get YearlyStats for a set of entity codes.
 * Returns a Map of entityCode → sorted array of { year, membership }.
 */
async function getStatsMap(codes) {
  const stats = await YearlyStats.find(
    { entityCode: { $in: codes } },
    { entityCode: 1, year: 1, membership: 1 },
  ).sort({ year: 1 }).lean()

  const map = new Map()
  for (const s of stats) {
    const mem = typeof s.membership === 'object' ? s.membership.ending : s.membership
    if (!mem || isNaN(mem)) continue
    if (!map.has(s.entityCode)) map.set(s.entityCode, [])
    map.get(s.entityCode).push({ year: s.year, membership: mem })
  }
  return map
}

// ── country-growth builder ────────────────────────────────────────────────────

/**
 * Build country-level YoY membership growth rates.
 *
 * Algorithm:
 *   1. Group entities by metadata.country
 *   2. For each country, sum membership across all entities for each year
 *   3. Find the latest year ≥ STALE_YEAR (default 2018)
 *   4. Compare latest year vs earliest year ≥ 3 years prior
 *   5. Compute annualised growth rate
 *
 * @returns {Array} Country growth entries
 */
async function buildCountryGrowth() {
  const STALE_YEAR = 2018
  const MIN_COMPARE_GAP = 2  // years

  const entities = await getCountryEntities()
  const codes = entities.map(e => e.code)
  const statsMap = await getStatsMap(codes)

  // Group entities by country
  const byCountry = new Map()
  for (const e of entities) {
    const country = e.metadata.country
    if (!byCountry.has(country)) byCountry.set(country, [])
    byCountry.get(country).push(e.code)
  }

  const results = []

  for (const [country, entityCodes] of byCountry) {
    // Aggregate membership by year across all entities for this country
    const yearTotals = new Map()
    for (const code of entityCodes) {
      const yearlyData = statsMap.get(code) || []
      for (const { year, membership } of yearlyData) {
        yearTotals.set(year, (yearTotals.get(year) || 0) + membership)
      }
    }

    if (yearTotals.size < 2) continue

    const years = [...yearTotals.keys()].sort((a, b) => a - b)
    const latestYear = years[years.length - 1]

    // Skip stale data
    if (latestYear < STALE_YEAR) continue

    // Find a prior year at least MIN_COMPARE_GAP years back
    const priorYear = years.slice().reverse().find(y => latestYear - y >= MIN_COMPARE_GAP)
    if (!priorYear) continue

    const latestMem = yearTotals.get(latestYear)
    const priorMem  = yearTotals.get(priorYear)
    if (!latestMem || !priorMem || priorMem === 0) continue

    const yearsCompared = latestYear - priorYear
    const totalGrowth   = (latestMem - priorMem) / priorMem
    const annualised    = Math.round(((totalGrowth / yearsCompared) * 100) * 100) / 100

    results.push({
      country,
      growthRate:        annualised,
      latestYear,
      latestMembership:  latestMem,
      priorYear,
      priorMembership:   priorMem,
      yearsCompared,
      entityCodes,
    })
  }

  return results.sort((a, b) => a.country.localeCompare(b.country))
}

// ── country-membership builder ────────────────────────────────────────────────

/**
 * Build latest known membership per country.
 * Used for the Adventist Density choropleth layer.
 */
async function buildCountryMembership() {
  const entities = await getCountryEntities()
  const codes = entities.map(e => e.code)
  const statsMap = await getStatsMap(codes)

  const byCountry = new Map()
  for (const e of entities) {
    const country = e.metadata.country
    if (!byCountry.has(country)) byCountry.set(country, [])
    byCountry.get(country).push(e.code)
  }

  const results = []
  for (const [country, entityCodes] of byCountry) {
    let totalMembership = 0
    let latestYear = 0

    for (const code of entityCodes) {
      const yearlyData = statsMap.get(code) || []
      if (!yearlyData.length) continue
      const latest = yearlyData[yearlyData.length - 1]
      totalMembership += latest.membership
      if (latest.year > latestYear) latestYear = latest.year
    }

    if (totalMembership > 0) {
      results.push({ country, membership: totalMembership, latestYear })
    }
  }

  return results.sort((a, b) => a.country.localeCompare(b.country))
}

// ── Cache layer ───────────────────────────────────────────────────────────────

const BUILDERS = {
  'country-growth':     buildCountryGrowth,
  'country-membership': buildCountryMembership,
}

/**
 * Get a computed stats dataset, building it if missing or stale.
 *
 * @param {string} key - Dataset key (e.g. 'country-growth')
 * @param {boolean} [forceRebuild=false] - Skip cache and rebuild
 * @returns {Promise<{ data: any, builtAt: Date, fresh: boolean }>}
 */
export async function getComputedStats(key, forceRebuild = false) {
  const builder = BUILDERS[key]
  if (!builder) throw new Error(`Unknown computed stats key: '${key}'`)

  if (!forceRebuild) {
    const cached = await ComputedStats.findOne({ key }).lean()
    if (cached && cached.expiresAt > new Date()) {
      return { data: cached.data, builtAt: cached.builtAt, fresh: true }
    }
  }

  logger.info(`[stats-service] Building '${key}'...`)
  const t0 = Date.now()
  const data = await builder()
  const buildMs = Date.now() - t0
  const now = new Date()

  await ComputedStats.findOneAndUpdate(
    { key },
    {
      key,
      data,
      builtAt:   now,
      expiresAt: new Date(now.getTime() + TTL_MS),
      buildMs,
    },
    { upsert: true, new: true },
  )

  logger.info(`[stats-service] Built '${key}' in ${buildMs}ms — ${Array.isArray(data) ? data.length : '?'} entries`)
  return { data, builtAt: now, fresh: false }
}

/**
 * Rebuild all computed stats keys. Called by nightly cron.
 */
export async function rebuildAllComputedStats() {
  for (const key of Object.keys(BUILDERS)) {
    try {
      await getComputedStats(key, true)
    } catch (err) {
      logger.error(`[stats-service] Failed to rebuild '${key}'`, err)
    }
  }
}
