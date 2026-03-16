import { BaseRepository } from './base.repository.js'
import { Report } from '../models/Report.js'
import { NotFoundError } from '../core/errors/index.js'

class ReportRepository extends BaseRepository {
  constructor() {
    super(Report)
  }

  async findBySlug(slug) {
    return this.model.findOne({ slug }).lean()
  }

  async findBySlugOrFail(slug) {
    const doc = await this.findBySlug(slug)
    if (!doc) throw new NotFoundError(`Report '${slug}'`)
    return doc
  }

  async findByType(type, { skip = 0, limit = 20 } = {}) {
    return this.find({ type }, { sort: { date: -1 }, skip, limit })
  }

  async findFeatured() {
    return this.find({ featured: true }, { sort: { date: -1 } })
  }

  async upsertBySlug(slug, data) {
    return this.model.findOneAndUpdate(
      { slug },
      data,
      { upsert: true, new: true, runValidators: true },
    ).lean()
  }
}

export const reportRepository = new ReportRepository()
