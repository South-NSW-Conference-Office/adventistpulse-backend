import { entityRepository } from '../repositories/entity.repository.js'
import { statsRepository } from '../repositories/stats.repository.js'

class RiskService {
  async assessRisk(code) {
    const entity = await entityRepository.findByCodeOrFail(code)
    const allStats = await statsRepository.findByEntityCode(code)

    if (allStats.length === 0) {
      return {
        code, name: entity.name, level: entity.level,
        overallRisk: 'healthy', flags: [],
        consecutiveDeclineYears: 0, projectedZeroYear: null,
        latestYear: null,
      }
    }

    const sorted = [...allStats].sort((a, b) => b.year - a.year)
    const latest = sorted[0]
    const latestYear = latest.year

    // Count consecutive decline years from most recent backward
    let consecutiveDeclineYears = 0
    for (const stat of sorted) {
      if (stat.membership?.growthRate != null && stat.membership.growthRate < 0) {
        consecutiveDeclineYears++
      } else {
        break
      }
    }

    // Projected zero year using avg growth rate of last 5 years
    let projectedZeroYear = null
    const recent5 = sorted.slice(0, 5).filter(s => s.membership?.growthRate != null)
    if (recent5.length > 0) {
      const avgRate = recent5.reduce((sum, s) => sum + s.membership.growthRate, 0) / recent5.length
      const currentMem = latest.membership?.ending ?? 0
      if (avgRate < 0 && currentMem > 0) {
        // M*(1+r)^n < 10 => n = log(10/M) / log(1+r)
        const n = Math.log(10 / currentMem) / Math.log(1 + avgRate)
        const projYear = Math.round(latestYear + n)
        if (projYear - latestYear <= 100) {
          projectedZeroYear = projYear
        }
      }
    }

    // Build flags
    const flags = []
    const m = latest.membership ?? {}
    const netGrowthRate = m.growthRate != null ? m.growthRate * 100 : null
    const retentionRate = m.retentionRate ?? null
    const accessionRate = m.accessionRate ?? null
    const lossRate = m.lossRate ?? null

    // Growth flags
    if (netGrowthRate != null) {
      if (netGrowthRate < -3) flags.push({ category: 'growth', label: 'Severe Decline', detail: `Net growth rate: ${netGrowthRate.toFixed(1)}%`, level: 'critical' })
      else if (netGrowthRate < -1) flags.push({ category: 'growth', label: 'Declining', detail: `Net growth rate: ${netGrowthRate.toFixed(1)}%`, level: 'warning' })
      else if (netGrowthRate < 0) flags.push({ category: 'growth', label: 'Slight Decline', detail: `Net growth rate: ${netGrowthRate.toFixed(1)}%`, level: 'watch' })
    }

    // Consecutive decline flags
    if (consecutiveDeclineYears >= 5) flags.push({ category: 'trend', label: 'Prolonged Decline', detail: `${consecutiveDeclineYears} consecutive years of decline`, level: 'critical' })
    else if (consecutiveDeclineYears >= 3) flags.push({ category: 'trend', label: 'Multi-Year Decline', detail: `${consecutiveDeclineYears} consecutive years of decline`, level: 'warning' })

    // Extinction risk
    if (projectedZeroYear != null && projectedZeroYear - latestYear <= 50) {
      flags.push({ category: 'projection', label: 'Extinction Risk', detail: `Projected below 10 members by ${projectedZeroYear}`, level: 'critical' })
    }

    // Retention flags
    if (retentionRate != null) {
      if (retentionRate < 90) flags.push({ category: 'retention', label: 'Severe Retention Crisis', detail: `Retention rate: ${retentionRate.toFixed(1)}%`, level: 'critical' })
      else if (retentionRate < 95) flags.push({ category: 'retention', label: 'Retention Concern', detail: `Retention rate: ${retentionRate.toFixed(1)}%`, level: 'warning' })
    }

    // Accession flags
    if (accessionRate != null) {
      if (accessionRate < 1) flags.push({ category: 'accession', label: 'Minimal Kingdom Growth', detail: `Accession rate: ${accessionRate.toFixed(1)}%`, level: 'critical' })
      else if (accessionRate < 2) flags.push({ category: 'accession', label: 'Low Kingdom Growth', detail: `Accession rate: ${accessionRate.toFixed(1)}%`, level: 'warning' })
    }

    // Loss rate flag
    if (lossRate != null && lossRate > 5) {
      flags.push({ category: 'loss', label: 'High Loss Rate', detail: `Loss rate: ${lossRate.toFixed(1)}%`, level: 'warning' })
    }

    // Overall risk = worst level from flags
    const levelPriority = { critical: 3, warning: 2, watch: 1 }
    let overallRisk = 'healthy'
    let maxPriority = 0
    for (const flag of flags) {
      const p = levelPriority[flag.level] ?? 0
      if (p > maxPriority) {
        maxPriority = p
        overallRisk = flag.level
      }
    }

    return {
      code, name: entity.name, level: entity.level,
      overallRisk, flags,
      consecutiveDeclineYears, projectedZeroYear,
      latestYear,
    }
  }

  async assessRiskBulk({ level, parentCode }) {
    const filter = {}
    if (level) filter.level = level
    if (parentCode) filter.parentCode = parentCode.toUpperCase()

    const entities = await entityRepository.find(filter, { limit: 10000 })
    const results = await Promise.all(entities.map(e => this.assessRisk(e.code)))
    return results
  }
}

export const riskService = new RiskService()
