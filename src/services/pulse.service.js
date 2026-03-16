import { entityRepository } from '../repositories/entity.repository.js'
import { statsRepository } from '../repositories/stats.repository.js'

class PulseService {
  #cache = new Map()
  #TTL = 60 * 60 * 1000 // 1 hour

  async getScore(code, year) {
    const entity = await entityRepository.findByCodeOrFail(code)

    let stat
    if (year) {
      const stats = await statsRepository.findByEntityCode(code, { from: Number(year), to: Number(year) })
      stat = stats[0] ?? null
    } else {
      stat = await statsRepository.findLatestForEntity(code)
    }

    if (!stat) {
      return {
        score: 0, grade: '—', breakdown: [], year: null,
        entityCode: code, entityName: entity.name,
        dataCompleteness: 0, missingData: ['No statistical data available'],
      }
    }

    const cacheKey = `${code}:${stat.year}`
    const cached = this.#cache.get(cacheKey)
    if (cached && Date.now() - cached.ts < this.#TTL) return cached.value

    // Compute previous year stats for tithe growth rate
    const prevStats = await statsRepository.findByEntityCode(code, { from: stat.year - 1, to: stat.year - 1 })
    const prevStat = prevStats[0] ?? null

    const result = this.#computeScore(stat, prevStat, entity)
    this.#cache.set(cacheKey, { value: result, ts: Date.now() })
    return result
  }

  async getScoreBulk({ level, parentCode, year }) {
    const filter = {}
    if (level) filter.level = level
    if (parentCode) filter.parentCode = parentCode.toUpperCase()

    const entities = await entityRepository.find(filter, { limit: 10000 })
    return Promise.all(entities.map(e => this.getScore(e.code, year)))
  }

  #computeScore(stat, prevStat, entity) {
    const m = stat.membership ?? {}
    const w = stat.workers ?? {}
    const f = stat.finance ?? {}
    const d = stat.derived ?? {}

    const missingData = []
    const components = []

    // Helper: normalize to 0-100
    const norm = (value, min, max, invert = false) => {
      if (value == null) return null
      const clamped = Math.max(min, Math.min(max, value))
      const normalized = ((clamped - min) / (max - min)) * 100
      return invert ? 100 - normalized : normalized
    }

    const toGrade = (score) => {
      if (score == null) return '—'
      if (score >= 80) return 'A'
      if (score >= 65) return 'B'
      if (score >= 50) return 'C'
      if (score >= 35) return 'D'
      return 'F'
    }

    // Derived metrics
    const accessionRate = m.accessionRate ?? null
    const netGrowthRate = m.growthRate != null ? m.growthRate * 100 : null
    const organicGrowthRate = m.beginning > 0 ? (((m.baptisms ?? 0) + (m.professionOfFaith ?? 0) - (m.deaths ?? 0) - (m.dropped ?? 0) - (m.missing ?? 0)) / m.beginning) * 100 : null
    const retentionRate = m.retentionRate ?? null
    const dropoutRate = m.dropoutRate ?? null
    const membersPerWorker = d.membersPerWorker ?? null
    const tithePerCapita = d.tithePerCapita ?? null
    const accessionEfficiency = (w.totalWorkers > 0 && m.totalAccessions != null)
      ? m.totalAccessions / w.totalWorkers : null
    const membersPerChurch = (stat.churches > 0 && m.ending > 0) ? m.ending / stat.churches : null

    // Tithe growth rate
    let titheGrowthRate = null
    if (prevStat?.finance?.tithe > 0 && f.tithe != null) {
      titheGrowthRate = ((f.tithe - prevStat.finance.tithe) / prevStat.finance.tithe) * 100
    }

    // 1. Kingdom Growth (15%)
    const accessionScore = norm(accessionRate, 0, 10)
    const efficiencyScore = norm(accessionEfficiency, 0, 5)
    const formationScore = accessionScore != null && efficiencyScore != null
      ? (accessionScore * 0.6 + efficiencyScore * 0.4)
      : accessionScore ?? efficiencyScore
    components.push({ category: 'Kingdom Growth', weight: 0.15, score: formationScore, grade: toGrade(formationScore), available: formationScore != null })
    if (formationScore == null) missingData.push('Baptism and profession of faith data')

    // 2. Mission Engagement (15%)
    const growthScore = norm(netGrowthRate, -5, 10)
    const organicScore = norm(organicGrowthRate, 0, 10)
    const missionScore = growthScore != null && organicScore != null
      ? (growthScore * 0.5 + organicScore * 0.5)
      : growthScore ?? organicScore
    components.push({ category: 'Mission Engagement', weight: 0.15, score: missionScore, grade: toGrade(missionScore), available: missionScore != null })
    if (missionScore == null) missingData.push('Growth and accession data')

    // 3. Community Connection (15%)
    const retScore = norm(retentionRate, 80, 100)
    const dropScore = norm(dropoutRate, 0, 20, true)
    const connectionScore = retScore ?? dropScore
    components.push({ category: 'Community Connection', weight: 0.15, score: connectionScore, grade: toGrade(connectionScore), available: connectionScore != null })
    if (connectionScore == null) missingData.push('Membership gain/loss data')

    // 4. Financial Stewardship (10%)
    const titheCapScore = norm(tithePerCapita, 0, 3000)
    const titheGrowScore = norm(titheGrowthRate, -10, 20)
    const finScore = titheCapScore != null && titheGrowScore != null
      ? (titheCapScore * 0.6 + titheGrowScore * 0.4)
      : titheCapScore ?? titheGrowScore
    components.push({ category: 'Financial Stewardship', weight: 0.10, score: finScore, grade: toGrade(finScore), available: finScore != null })
    if (finScore == null) missingData.push('Tithe and financial data')

    // 5. Organizational Health (10%)
    const workerScore = norm(membersPerWorker, 50, 600, true)
    components.push({ category: 'Organizational Health', weight: 0.10, score: workerScore, grade: toGrade(workerScore), available: workerScore != null })
    if (workerScore == null) missingData.push('Worker and staffing data')

    // 6. Leadership Effectiveness (15%) — placeholder
    components.push({ category: 'Leadership Effectiveness', weight: 0.15, score: null, grade: '—', available: false })
    missingData.push('Leadership tenure and personnel data')

    // 7. Worship Vitality (10%) — placeholder
    components.push({ category: 'Worship Vitality', weight: 0.10, score: null, grade: '—', available: false })
    missingData.push('Attendance and demographic data')

    // 8. Future Readiness (10%) — placeholder
    components.push({ category: 'Future Readiness', weight: 0.10, score: null, grade: '—', available: false })
    missingData.push('Youth retention and digital engagement data')

    // Calculate overall
    let totalWeight = 0
    let weightedSum = 0
    let availableWeight = 0

    for (const comp of components) {
      if (comp.available && comp.score != null) {
        weightedSum += comp.score * comp.weight
        totalWeight += comp.weight
      }
      if (comp.available) availableWeight += comp.weight
    }

    const overall = totalWeight > 0 ? weightedSum / totalWeight : 0
    const score = Math.round(overall * 10) / 10
    const dataCompleteness = Math.round((availableWeight / 1.0) * 100)

    return {
      score,
      grade: toGrade(score),
      breakdown: components,
      year: stat.year,
      entityCode: entity.code,
      entityName: entity.name,
      dataCompleteness,
      missingData,
    }
  }
}

export const pulseService = new PulseService()
