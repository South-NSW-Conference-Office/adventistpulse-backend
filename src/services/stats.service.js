import { statsRepository } from '../repositories/stats.repository.js'
import { entityRepository } from '../repositories/entity.repository.js'
import { getPaginationParams } from '../lib/paginate.js'
import { OrgUnit }        from '../models/OrgUnit.js'
import { YearlyStats }    from '../models/YearlyStats.js'
import { ComputedStats }  from '../models/ComputedStats.js'
import { logger }         from '../core/logger.js'

// ── Projection constants ──────────────────────────────────────────────────────
// Historical average annual growth rate for a typical division (conservative baseline)
const DIVISION_AVG_GROWTH_RATE = 0.005
// Maximum annual growth rate assumed for the revival scenario (capped at 5%)
const MAX_REVIVAL_GROWTH_RATE  = 0.05
// Years of CAGR history used for the "current trend" scenario
const CAGR_LOOKBACK_YEARS      = 5
// Years of history scanned when looking for the entity's best 5-year growth run
const RECENT_BEST_LOOKBACK_YEARS = 20
// Projection extinction threshold — below this membership, entity is considered gone
const EXTINCTION_THRESHOLD     = 10
// Longest projection horizon considered meaningful (years)
const MAX_PROJECTION_HORIZON   = 150

class StatsService {
  async getForEntity(code, query) {
    const entity = await entityRepository.findByCodeOrFail(code)
    const { from, to } = query
    // Fetch stats for canonical code — alias stats were migrated to canonical during dedup
    // Use the resolved entity's canonical code (in case 'code' was an alias)
    return statsRepository.findByEntityCode(entity.code, { from, to })
  }

  async getRankings(query) {
    const { page, limit, skip } = getPaginationParams(query)
    const { level, metric, parentCode } = query
    const year = query.year ? Number(query.year) : new Date().getFullYear() - 1

    const [data, total] = await Promise.all([
      statsRepository.getRankings({ level, metric, year, parentCode, skip, limit }),
      statsRepository.countRankings({ level, metric, year, parentCode }),
    ])

    return { data, total, page, limit }
  }

  async getCountryRankings(query) {
    const { year, metric, level, limit } = query
    return statsRepository.getCountryRankings({
      year:   Number(year),
      metric,
      level,
      limit:  limit ? Number(limit) : 5,
    })
  }

  async importStats({ entityCode, stats }) {
    await entityRepository.findByCodeOrFail(entityCode)

    const results = await Promise.all(
      stats.map(stat => {
        const enriched = this.#computeDerivedFields(stat)
        return statsRepository.upsert(entityCode, stat.year, enriched)
      })
    )

    return { imported: results.length, entityCode }
  }

  async getMapData(query) {
    return statsRepository.getMapData(Number(query.year))
  }

  async getCountryTrend(query) {
    const { country, metric, lookback } = query
    return statsRepository.getCountryTrend(country, metric, Number(lookback))
  }

  async getCountrySummary(query) {
    const { country } = query
    const year = query.year ? Number(query.year) : new Date().getFullYear() - 1
    return statsRepository.getCountrySummary(country, year)
  }

  async getProjections(code) {
    const entity = await entityRepository.findByCodeOrFail(code)
    const allStats = await statsRepository.findByEntityCode(code)

    if (allStats.length < 2) {
      return {
        entityCode: code, entityName: entity.name,
        points: [], extinctionYear: null, milestones: [],
        currentRate: 0, moderateRate: 0, revivalRate: 0,
        scenarios: {}, insights: ['Insufficient historical data for projections.'],
      }
    }

    // Sort ascending by year
    const sorted = [...allStats].sort((a, b) => a.year - b.year)
    const membership = sorted
      .filter(s => s.membership?.ending > 0)
      .map(s => [s.year, s.membership.ending])

    if (membership.length < 2) {
      return {
        entityCode: code, entityName: entity.name,
        points: [], extinctionYear: null, milestones: [],
        currentRate: 0, moderateRate: 0, revivalRate: 0,
        scenarios: {}, insights: ['Insufficient membership data for projections.'],
      }
    }

    const latestYear = membership[membership.length - 1][0]
    const latestMem = membership[membership.length - 1][1]

    // CAGR over last N years
    const recentYears = Math.min(CAGR_LOOKBACK_YEARS, membership.length - 1)
    const recentStart = membership[membership.length - 1 - recentYears]
    const currentRate = this.#cagr(recentStart[1], latestMem, recentYears)

    // Recent best 5-year rate (last RECENT_BEST_LOOKBACK_YEARS years)
    const recentBest = this.#recentBestRate(membership)

    // Moderate: median of [halfDecline, divisionAvg, recentBest]
    const halfDecline = currentRate < 0 ? currentRate / 2 : currentRate + 0.01
    const candidates = [halfDecline, DIVISION_AVG_GROWTH_RATE, recentBest ?? halfDecline].sort((a, b) => a - b)
    let moderateRate = candidates[1]
    if (moderateRate <= currentRate) moderateRate = currentRate + 0.015

    // Revival: max of candidates, ensure > moderate, cap at MAX_REVIVAL_GROWTH_RATE
    const revivalCandidates = [moderateRate + 0.02, recentBest ?? moderateRate + 0.02, moderateRate + 0.02]
    let revivalRate = Math.max(...revivalCandidates)
    if (revivalRate <= moderateRate) revivalRate = moderateRate + 0.015
    revivalRate = Math.min(revivalRate, MAX_REVIVAL_GROWTH_RATE)

    const project = (base, rate, years) => Math.max(0, Math.round(base * Math.pow(1 + rate, years)))
    const generate = (years) => {
      const points = []
      for (let y = 1; y <= years; y++) {
        points.push({
          year: latestYear + y,
          current: project(latestMem, currentRate, y),
          moderate: project(latestMem, moderateRate, y),
          revival: project(latestMem, revivalRate, y),
        })
      }
      return points
    }

    // Extinction year — when projected membership falls below EXTINCTION_THRESHOLD
    let extinctionYear = null
    if (currentRate < 0 && latestMem > 0) {
      const n = Math.log(EXTINCTION_THRESHOLD / latestMem) / Math.log(1 + currentRate)
      extinctionYear = Math.round(latestYear + n)
    }

    // Milestones
    const milestones = []
    if (currentRate < 0 && latestMem > 0) {
      const thresholds = []
      if (latestMem > 50) thresholds.push({ value: 50, label: "Can't fill a single church" })
      if (latestMem > 100) thresholds.push({ value: 100, label: 'Below 100 members' })
      if (latestMem > 500) thresholds.push({ value: 500, label: "Can't sustain a conference" })
      if (latestMem > 1000) thresholds.push({ value: 1000, label: 'Below 1,000 members' })
      if (latestMem > 200) thresholds.push({ value: Math.round(latestMem / 2), label: `Half of today (${Math.round(latestMem / 2).toLocaleString()})` })
      if (latestMem > 10000) thresholds.push({ value: Math.round(latestMem * 0.1), label: `90% loss (${Math.round(latestMem * 0.1).toLocaleString()} remaining)` })

      // Next thresholds above current
      for (const t of [10000, 25000, 50000, 100000, 500000]) {
        if (t > latestMem && currentRate > 0) {
          const n = Math.log(t / latestMem) / Math.log(1 + currentRate)
          const year = Math.round(latestYear + n)
          const yearsFromNow = year - latestYear
          if (yearsFromNow > 0 && yearsFromNow <= 150) {
            milestones.push({ threshold: t, year, label: `Reach ${t.toLocaleString()} members`, yearsFromNow })
          }
        }
      }

      for (const t of thresholds) {
        const n = Math.log(t.value / latestMem) / Math.log(1 + currentRate)
        const year = Math.round(latestYear + n)
        const yearsFromNow = year - latestYear
        if (yearsFromNow > 0 && yearsFromNow <= MAX_PROJECTION_HORIZON) {
          milestones.push({ threshold: t.value, year, label: t.label, yearsFromNow })
        }
      }
      milestones.sort((a, b) => a.yearsFromNow - b.yearsFromNow)
    }

    // Insights
    const insights = []
    const ratePercent = Math.abs(Math.round(currentRate * 100 * 10) / 10)
    if (currentRate < -0.02) insights.push(`Losing ${ratePercent}% annually — critical decline.`)
    else if (currentRate < 0) insights.push(`Declining at ${ratePercent}% per year.`)
    else if (currentRate > 0.03) insights.push(`Strong growth: +${ratePercent}% annually.`)
    else if (currentRate > 0) insights.push(`Modest growth: +${ratePercent}% per year.`)

    if (milestones.length > 0) {
      insights.push(`${milestones[0].label} by ${milestones[0].year} (${milestones[0].yearsFromNow} years).`)
    }

    const annualLoss = currentRate < 0 ? Math.round(latestMem * Math.abs(currentRate)) : 0
    if (annualLoss > 0) insights.push(`Every year of delay costs ~${annualLoss.toLocaleString()} members.`)

    return {
      entityCode: code,
      entityName: entity.name,
      points5: generate(5),
      points10: generate(10),
      points20: generate(20),
      extinctionYear,
      milestones,
      currentRate, moderateRate, revivalRate,
      insights,
    }
  }

  #cagr(start, end, years) {
    if (start <= 0 || end <= 0 || years <= 0) return 0
    return Math.pow(end / start, 1 / years) - 1
  }

  #recentBestRate(membership) {
    const cutoff = (membership[membership.length - 1]?.[0] ?? 2024) - RECENT_BEST_LOOKBACK_YEARS
    const recent = membership.filter(([y]) => y >= cutoff)
    let best = -Infinity
    for (let i = 0; i < recent.length - 5; i++) {
      const [, startMem] = recent[i]
      const [, endMem] = recent[i + 5]
      if (startMem > 0 && endMem > 0) {
        const rate = this.#cagr(startMem, endMem, 5)
        if (rate > best) best = rate
      }
    }
    return best > -Infinity ? best : null
  }

  // Compute derived membership fields before saving
  #computeDerivedFields(stat) {
    const m = stat.membership ?? {}
    if (Object.keys(m).length === 0) return stat

    const totalGains  = (m.baptisms ?? 0) + (m.professionOfFaith ?? 0) + (m.transfersIn ?? 0)
    const totalLosses = (m.deaths ?? 0) + (m.dropped ?? 0) + (m.missing ?? 0) + (m.transfersOut ?? 0)
    const netGrowth   = totalGains - totalLosses
    const growthRate  = m.beginning > 0 ? parseFloat((netGrowth / m.beginning).toFixed(6)) : null

    const dropped = m.dropped ?? 0
    const missing = m.missing ?? 0
    const baptisms = m.baptisms ?? 0
    const professionOfFaith = m.professionOfFaith ?? 0
    const totalAccessions = baptisms + professionOfFaith

    const retentionRate = m.beginning > 0
      ? parseFloat(((1 - ((dropped + missing) / m.beginning)) * 100).toFixed(6))
      : null
    const dropoutRate = m.beginning > 0
      ? parseFloat((((dropped + missing) / m.beginning) * 100).toFixed(6))
      : null
    const lossRate = m.beginning > 0
      ? parseFloat(((totalLosses / m.beginning) * 100).toFixed(6))
      : null
    const accessionRate = m.beginning > 0
      ? parseFloat(((totalAccessions / m.beginning) * 100).toFixed(6))
      : null

    // Derived cross-domain fields
    const w = stat.workers ?? {}
    const f = stat.finance ?? {}
    const ending = m.ending ?? 0
    const membersPerWorker = (w.totalWorkers && w.totalWorkers > 0 && ending > 0)
      ? parseFloat((ending / w.totalWorkers).toFixed(6))
      : null
    const tithePerCapita = (f.tithe != null && ending > 0)
      ? parseFloat((f.tithe / ending).toFixed(6))
      : null

    return {
      ...stat,
      membership: {
        ...m, totalGains, totalLosses, netGrowth, growthRate,
        retentionRate, dropoutRate, lossRate, accessionRate, totalAccessions,
      },
      derived: { membersPerWorker, tithePerCapita },
    }
  }
}

export const statsService = new StatsService()

// ── Computed Stats (country-level aggregations) ───────────────────────────────
//
// Expensive datasets cached in MongoDB (ComputedStats collection) for 24h.
// Rebuilt on expiry or on demand via ?rebuild=true&secret=X on the route.
// Nightly cron calls rebuildAllComputedStats() after the signal sweep.
//
// Design principles:
//   SRP — computation logic here; persistence in ComputedStats model.
//   OCP — add new computed keys to BUILDERS without touching existing code.
//   DRY — shared helpers getCountryEntities() and getStatsMap() used by all builders.

const TTL_MS = 24 * 60 * 60 * 1000  // 24 hours

// ── Shared helpers ────────────────────────────────────────────────────────────

/**
 * Get all visible entities that have a metadata.country set.
 * Building block for all country-level aggregations.
 * @returns {Promise<object[]>}
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
 *   2. Sum membership across all entities per year
 *   3. Find latest year ≥ STALE_YEAR; find prior year ≥ MIN_COMPARE_GAP years back
 *   4. Compute annualised growth rate
 */
async function buildCountryGrowth() {
  const STALE_YEAR       = 2018
  const MIN_COMPARE_GAP  = 2

  const entities = await getCountryEntities()
  const statsMap = await getStatsMap(entities.map(e => e.code))

  const byCountry = new Map()
  for (const e of entities) {
    const country = e.metadata.country
    if (!byCountry.has(country)) byCountry.set(country, [])
    byCountry.get(country).push(e.code)
  }

  const results = []
  for (const [country, entityCodes] of byCountry) {
    const yearTotals = new Map()
    for (const code of entityCodes) {
      for (const { year, membership } of statsMap.get(code) || []) {
        yearTotals.set(year, (yearTotals.get(year) || 0) + membership)
      }
    }
    if (yearTotals.size < 2) continue

    const years      = [...yearTotals.keys()].sort((a, b) => a - b)
    const latestYear = years[years.length - 1]
    if (latestYear < STALE_YEAR) continue

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
      growthRate:       annualised,
      latestYear,
      latestMembership: latestMem,
      priorYear,
      priorMembership:  priorMem,
      yearsCompared,
      entityCodes,
    })
  }
  return results.sort((a, b) => a.country.localeCompare(b.country))
}

// ── country-membership builder ────────────────────────────────────────────────

/** Build latest known membership per country (Adventist Density choropleth). */
async function buildCountryMembership() {
  const entities = await getCountryEntities()
  const statsMap = await getStatsMap(entities.map(e => e.code))

  const byCountry = new Map()
  for (const e of entities) {
    const country = e.metadata.country
    if (!byCountry.has(country)) byCountry.set(country, [])
    byCountry.get(country).push(e.code)
  }

  const results = []
  for (const [country, entityCodes] of byCountry) {
    let totalMembership = 0
    let latestYear      = 0
    for (const code of entityCodes) {
      const yearlyData = statsMap.get(code) || []
      if (!yearlyData.length) continue
      const latest = yearlyData[yearlyData.length - 1]
      totalMembership += latest.membership
      if (latest.year > latestYear) latestYear = latest.year
    }
    if (totalMembership > 0) results.push({ country, membership: totalMembership, latestYear })
  }
  return results.sort((a, b) => a.country.localeCompare(b.country))
}

// ── Cache layer ───────────────────────────────────────────────────────────────

const BUILDERS = {
  'country-growth':     buildCountryGrowth,
  'country-membership': buildCountryMembership,
}

/**
 * Get a computed stats dataset — serve from cache, or build if missing/stale.
 *
 * @param {string}  key            - Dataset key (e.g. 'country-growth')
 * @param {boolean} [forceRebuild] - Skip cache and rebuild immediately
 * @returns {Promise<{ data, builtAt: Date, fresh: boolean }>}
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
  const t0      = Date.now()
  const data    = await builder()
  const buildMs = Date.now() - t0
  const now     = new Date()

  await ComputedStats.findOneAndUpdate(
    { key },
    { key, data, builtAt: now, expiresAt: new Date(now.getTime() + TTL_MS), buildMs },
    { upsert: true, new: true },
  )

  logger.info(`[stats-service] Built '${key}' in ${buildMs}ms — ${Array.isArray(data) ? data.length : '?'} entries`)
  return { data, builtAt: now, fresh: false }
}

/**
 * Rebuild all computed stats keys. Called by the nightly cron in signal.job.js.
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
