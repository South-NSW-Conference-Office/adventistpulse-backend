import { statsRepository } from '../repositories/stats.repository.js'
import { entityRepository } from '../repositories/entity.repository.js'
import { getPaginationParams } from '../lib/paginate.js'

class StatsService {
  async getForEntity(code, query) {
    await entityRepository.findByCodeOrFail(code)
    const { from, to } = query
    return statsRepository.findByEntityCode(code, { from, to })
  }

  async getRankings(query) {
    const { page, limit, skip } = getPaginationParams(query)
    const { level, metric, year, parentCode } = query

    const [data, total] = await Promise.all([
      statsRepository.getRankings({ level, metric, year: Number(year), parentCode, skip, limit }),
      statsRepository.countRankings({ level, metric, year: Number(year), parentCode }),
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
    const { country, year } = query
    return statsRepository.getCountrySummary(country, Number(year))
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

    // CAGR over last 5 years
    const recentYears = Math.min(5, membership.length - 1)
    const recentStart = membership[membership.length - 1 - recentYears]
    const currentRate = this.#cagr(recentStart[1], latestMem, recentYears)

    // Recent best 5-year rate (last 20 years)
    const recentBest = this.#recentBestRate(membership)

    // Moderate: median of [halfDecline, divisionAvg, recentBest]
    const divAvg = 0.005
    const halfDecline = currentRate < 0 ? currentRate / 2 : currentRate + 0.01
    const candidates = [halfDecline, divAvg, recentBest ?? halfDecline].sort((a, b) => a - b)
    let moderateRate = candidates[1]
    if (moderateRate <= currentRate) moderateRate = currentRate + 0.015

    // Revival: max of candidates, ensure > moderate, cap at 5%
    const revivalCandidates = [moderateRate + 0.02, recentBest ?? moderateRate + 0.02, moderateRate + 0.02]
    let revivalRate = Math.max(...revivalCandidates)
    if (revivalRate <= moderateRate) revivalRate = moderateRate + 0.015
    revivalRate = Math.min(revivalRate, 0.05)

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

    // Extinction year
    let extinctionYear = null
    if (currentRate < 0 && latestMem > 0) {
      const n = Math.log(1 / latestMem) / Math.log(1 + currentRate)
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
        if (yearsFromNow > 0 && yearsFromNow <= 150) {
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
    const cutoff = (membership[membership.length - 1]?.[0] ?? 2024) - 20
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
