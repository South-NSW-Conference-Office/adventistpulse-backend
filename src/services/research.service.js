import { researchRepository } from '../repositories/research.repository.js'
import { getPaginationParams } from '../lib/paginate.js'

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
}

export const researchService = new ResearchService()
