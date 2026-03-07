import { BaseRepository } from './base.repository.js'
import { YearlyStats } from '../models/YearlyStats.js'

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
