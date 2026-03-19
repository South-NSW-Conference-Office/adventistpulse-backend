import { researchRepository } from '../repositories/research.repository.js'
import { getPaginationParams } from '../lib/paginate.js'
import { NotFoundError } from '../core/errors/index.js'

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

class ResearchService {
  async list(query) {
    const { page, limit } = getPaginationParams(query)
    const filter = {}
    if (query.status)   filter.status = query.status
    if (query.tag)      filter.tags = query.tag
    if (query.featured) filter.featured = query.featured === 'true'
    if (query.search)   filter.title = { $regex: escapeRegex(query.search), $options: 'i' }

    const { data, total } = await researchRepository.paginate(filter, { page, limit, sort: { lastUpdated: -1 } })
    return { data, total, page, limit }
  }

  async getById(id) {
    return researchRepository.findByIdOrFail(id)
  }

  async getFeatured() {
    return researchRepository.findFeatured()
  }

  /**
   * Returns full body text for a research paper (authenticated users only).
   * Body is seeded via scripts/seed-lrp-body.js.
   * Returns { id, body } where body may be null if not yet seeded.
   */
  async getBody(id) {
    const doc = await researchRepository.findBodyById(id)
    if (!doc) throw new NotFoundError(`ResearchPaper '${id}'`)
    return { id: doc.id, body: doc.body ?? null }
  }
}

export const researchService = new ResearchService()
