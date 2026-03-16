import { reportRepository } from '../repositories/report.repository.js'
import { getPaginationParams } from '../lib/paginate.js'

class ReportService {
  async list(query) {
    const { page, limit } = getPaginationParams(query)
    const filter = {}
    if (query.type)       filter.type = query.type
    if (query.year)       filter.year = Number(query.year)
    if (query.entityCode) filter.entityCode = query.entityCode
    if (query.featured)   filter.featured = query.featured === 'true'

    const { data, total } = await reportRepository.paginate(filter, { page, limit, sort: { date: -1 } })
    return { data, total, page, limit }
  }

  async getBySlug(slug) {
    return reportRepository.findBySlugOrFail(slug)
  }

  async create(data) {
    return reportRepository.upsertBySlug(data.slug, data)
  }
}

export const reportService = new ReportService()
