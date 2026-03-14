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

  getCountryRankings: asyncHandler(async (req, res) => {
    const data = await statsService.getCountryRankings(req.query)
    response.success(res, data)
  }),

  getMapData: asyncHandler(async (req, res) => {
    const data = await statsService.getMapData(req.query)
    response.success(res, data)
  }),

  getCountryTrend: asyncHandler(async (req, res) => {
    const data = await statsService.getCountryTrend(req.query)
    response.success(res, data)
  }),

  getCountrySummary: asyncHandler(async (req, res) => {
    const data = await statsService.getCountrySummary(req.query)
    response.success(res, data)
  }),

  importStats: asyncHandler(async (req, res) => {
    const result = await statsService.importStats(req.body)
    response.created(res, result)
  }),
}
