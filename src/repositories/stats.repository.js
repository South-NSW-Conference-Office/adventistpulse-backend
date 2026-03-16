import { BaseRepository } from './base.repository.js'
import { YearlyStats } from '../models/YearlyStats.js'
import { OrgUnit } from '../models/OrgUnit.js'

class StatsRepository extends BaseRepository {
  constructor() {
    super(YearlyStats)
  }

  async findByEntityCode(entityCode, { from, to } = {}) {
    const filter = { entityCode: entityCode.toUpperCase() }
    if (from || to) {
      filter.year = {}
      if (from) filter.year.$gte = from
      if (to)   filter.year.$lte = to
    }
    return this.find(filter, { sort: { year: -1 } })
  }

  async findLatestForEntity(entityCode) {
    return this.model.findOne({ entityCode: entityCode.toUpperCase() })
      .sort({ year: -1 })
      .lean()
  }

  async findLatestForEntities(entityCodes) {
    // Returns the most recent stat record for each entity code
    return this.model.aggregate([
      { $match: { entityCode: { $in: entityCodes.map(c => c.toUpperCase()) } } },
      { $sort: { year: -1 } },
      { $group: { _id: '$entityCode', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
    ])
  }

  async findYearRangesForEntities(entityCodes) {
    return this.model.aggregate([
      { $match: { entityCode: { $in: entityCodes.map(c => c.toUpperCase()) } } },
      { $group: { _id: '$entityCode', minYear: { $min: '$year' }, maxYear: { $max: '$year' } } },
    ])
  }

  async getCountryRankings({ year, metric = 'membership', level, limit = 5 }) {
    const metricField = {
      membership: '$membership.ending',
      baptisms:   '$membership.baptisms',
      tithe:      '$finance.tithe',
      churches:   '$churches',
    }[metric] ?? '$membership.ending'

    const matchStage = { year: Number(year) }
    const entityMatchStage = {
      'unit.metadata.country': { $exists: true, $ne: null, $nin: ['', null] },
      ...(level ? { 'unit.level': level } : {}),
    }

    return this.model.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'orgunits',
          localField: 'entityCode',
          foreignField: 'code',
          as: 'unit',
        },
      },
      { $unwind: '$unit' },
      { $match: entityMatchStage },
      {
        $group: {
          _id:          '$unit.metadata.country',
          value:        { $sum: metricField },
          entityCount:  { $sum: 1 },
        },
      },
      { $match: { value: { $gt: 0 } } },
      { $sort: { value: -1 } },
      { $limit: Number(limit) },
      {
        $project: {
          _id:         0,
          country:     '$_id',
          value:       1,
          entityCount: 1,
        },
      },
    ])
  }

  #deriveStatus(growthRate) {
    if (growthRate == null) return 'unknown'
    if (growthRate >= 0.02)  return 'thriving'
    if (growthRate >= 0)     return 'watch'
    if (growthRate >= -0.02) return 'at-risk'
    return 'critical'
  }

  #statusSeverity(status) {
    return { unknown: 0, thriving: 1, watch: 2, 'at-risk': 3, critical: 4 }[status] ?? 0
  }

  async getMapData(year) {
    const rows = await this.model.aggregate([
      { $match: { year } },
      {
        $lookup: {
          from: 'orgunits',
          localField: 'entityCode',
          foreignField: 'code',
          as: 'unit',
        },
      },
      { $unwind: '$unit' },
      { $match: { 'unit.metadata.country': { $exists: true, $ne: null, $nin: ['', null] } } },
      {
        $project: {
          country:    '$unit.metadata.country',
          entityName: '$unit.name',
          entityCode: '$entityCode',
          level:      '$unit.level',
          growthRate: '$membership.growthRate',
          membershipEnding: '$membership.ending',
        },
      },
    ])

    const byCountry = new Map()
    for (const row of rows) {
      const status   = this.#deriveStatus(row.growthRate)
      const severity = this.#statusSeverity(status)
      const existing = byCountry.get(row.country)

      const membershipVal = row.membershipEnding ?? 0

      if (!existing) {
        byCountry.set(row.country, {
          country:    row.country,
          status,
          membership: membershipVal,
          growthRate: row.growthRate ?? null,
          entityName: row.entityName,
          entityCode: row.entityCode,
          level:      row.level,
          _severity:  severity,
        })
      } else {
        existing.membership += membershipVal
        if (severity > existing._severity) {
          existing.status     = status
          existing.growthRate = row.growthRate ?? null
          existing.entityName = row.entityName
          existing.entityCode = row.entityCode
          existing.level      = row.level
          existing._severity  = severity
        }
      }
    }

    return [...byCountry.values()].map(({ _severity, ...rest }) => rest)
  }

  async getCountryTrend(country, metric, lookback) {
    const currentYear = new Date().getFullYear()
    const fromYear    = currentYear - lookback + 1

    const units = await OrgUnit.find({ 'metadata.country': country }).select('code').lean()
    if (!units.length) return []

    const codes = units.map(u => u.code)

    const metricField = {
      membership: '$membership.ending',
      baptisms:   '$membership.baptisms',
      tithe:      '$finance.tithe',
      net_growth: '$membership.netGrowth',
    }[metric] ?? '$membership.ending'

    return this.model.aggregate([
      { $match: { entityCode: { $in: codes }, year: { $gte: fromYear, $lte: currentYear } } },
      { $group: { _id: '$year', value: { $sum: metricField } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, year: '$_id', value: 1 } },
    ])
  }

  async getCountrySummary(country, year) {
    const units = await OrgUnit.find({ 'metadata.country': country }).select('code').lean()
    if (!units.length) return null

    const codes = units.map(u => u.code)

    const result = await this.model.aggregate([
      { $match: { entityCode: { $in: codes }, year } },
      {
        $group: {
          _id:        null,
          membership: { $sum: '$membership.ending' },
          baptisms:   { $sum: '$membership.baptisms' },
          netGrowth:  { $sum: '$membership.netGrowth' },
          tithe:      { $sum: '$finance.tithe' },
          entityCount:{ $sum: 1 },
          totalBeginning: { $sum: '$membership.beginning' },
        },
      },
    ])

    if (!result.length) return null

    const agg = result[0]
    const overallGrowthRate = agg.totalBeginning > 0
      ? agg.netGrowth / agg.totalBeginning
      : null
    const status = this.#deriveStatus(overallGrowthRate)

    return {
      country,
      year,
      membership:  agg.membership,
      baptisms:    agg.baptisms,
      netGrowth:   agg.netGrowth,
      tithe:       agg.tithe,
      entityCount: agg.entityCount,
      status,
    }
  }

  async deleteByEntityCode(entityCode) {
    return this.model.deleteMany({ entityCode: entityCode.toUpperCase() })
  }

  async upsert(entityCode, year, data) {
    return this.model.findOneAndUpdate(
      { entityCode: entityCode.toUpperCase(), year },
      { $set: { ...data, entityCode: entityCode.toUpperCase(), year } },
      { upsert: true, new: true, runValidators: true }
    ).lean()
  }

  async countRankings({ level, metric, year, parentCode }) {
    const result = await this.model.aggregate([
      { $match: { year } },
      { $lookup: { from: 'orgunits', localField: 'entityCode', foreignField: 'code', as: 'entity' } },
      { $unwind: '$entity' },
      { $match: { 'entity.level': level, ...(parentCode ? { 'entity.parentCode': parentCode.toUpperCase() } : {}) } },
      { $count: 'total' },
    ])
    return result[0]?.total ?? 0
  }

  async getRankings({ level, metric, year, parentCode, skip = 0, limit = 20 }) {
    const metricMap = {
      baptisms: '$membership.baptisms',
      growth_rate: '$membership.growthRate',
      tithe_per_member: { $cond: [{ $gt: ['$membership.ending', 0] }, { $divide: ['$finance.tithe', '$membership.ending'] }, null] },
      retention: { $cond: [{ $gt: ['$membership.beginning', 0] }, { $subtract: [1, { $divide: [{ $add: ['$membership.dropped', '$membership.missing'] }, '$membership.beginning'] }] }, null] },
    }

    // Join with OrgUnit to filter by level and parentCode
    return this.model.aggregate([
      { $match: { year } },
      {
        $lookup: {
          from: 'orgunits',
          localField: 'entityCode',
          foreignField: 'code',
          as: 'entity',
        },
      },
      { $unwind: '$entity' },
      { $match: { 'entity.level': level, ...(parentCode ? { 'entity.parentCode': parentCode.toUpperCase() } : {}) } },
      { $addFields: { metricValue: metricMap[metric] } },
      { $match: { metricValue: { $ne: null } } },
      { $sort: { metricValue: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          entityCode: 1, year: 1, metricValue: 1,
          entityName: '$entity.name', entityLevel: '$entity.level',
        },
      },
    ])
  }
}

export const statsRepository = new StatsRepository()
