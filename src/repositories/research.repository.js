import { BaseRepository } from './base.repository.js'
import { ResearchPaper } from '../models/ResearchPaper.js'
import { NotFoundError } from '../core/errors/index.js'

class ResearchRepository extends BaseRepository {
  constructor() {
    super(ResearchPaper)
  }

  async findById(id) {
    return this.model.findOne({ id }).lean()
  }

  async findByIdOrFail(id) {
    const doc = await this.findById(id)
    if (!doc) throw new NotFoundError(`ResearchPaper '${id}'`)
    return doc
  }

  async findFeatured() {
    return this.find({ featured: true }, { sort: { lastUpdated: -1 } })
  }

  async findByStatus(status, { skip = 0, limit = 20 } = {}) {
    return this.find({ status }, { sort: { lastUpdated: -1 }, skip, limit })
  }

  async findByTag(tag, { skip = 0, limit = 20 } = {}) {
    return this.find({ tags: tag }, { sort: { lastUpdated: -1 }, skip, limit })
  }
}

export const researchRepository = new ResearchRepository()
