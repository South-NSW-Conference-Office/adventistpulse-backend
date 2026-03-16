import { reportRepository } from '../repositories/report.repository.js'
import { Report } from '../models/Report.js'
import { getPaginationParams } from '../lib/paginate.js'

class ReportService {
  async list(query) {
    const { page, limit, skip } = getPaginationParams(query)
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
    return Report.findOneAndUpdate(
      { slug: data.slug },
      data,
      { upsert: true, new: true, runValidators: true },
    ).lean()
  }
}

export const reportService = new ReportService()
