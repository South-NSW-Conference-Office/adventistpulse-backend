import { statsService } from '../services/stats.service.js'
import { response } from '../core/response.js'
import { asyncHandler } from './base.controller.js'

export const statsController = {
  getForEntity: asyncHandler(async (req, res) => {
    const stats = await statsService.getForEntity(req.params.code, req.query)
    response.success(res, stats)
  }),

  getRankings: asyncHandler(async (req, res) => {
    const { data, total, page, limit } = await statsService.getRankings(req.query)
    response.paginated(res, data, { total, page, limit })
  }),

  importStats: asyncHandler(async (req, res) => {
    const result = await statsService.importStats(req.body)
    response.created(res, result)
  }),
}
