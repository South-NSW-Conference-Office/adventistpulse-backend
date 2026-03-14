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

  // Compute derived membership fields before saving
  #computeDerivedFields(stat) {
    const m = stat.membership ?? {}
    if (Object.keys(m).length === 0) return stat

    const totalGains  = (m.baptisms ?? 0) + (m.professionOfFaith ?? 0) + (m.transfersIn ?? 0)
    const totalLosses = (m.deaths ?? 0) + (m.dropped ?? 0) + (m.missing ?? 0) + (m.transfersOut ?? 0)
    const netGrowth   = totalGains - totalLosses
    const growthRate  = m.beginning > 0 ? parseFloat((netGrowth / m.beginning).toFixed(6)) : null

    return {
      ...stat,
      membership: { ...m, totalGains, totalLosses, netGrowth, growthRate },
    }
  }
}

export const statsService = new StatsService()
