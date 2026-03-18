import { Router } from 'express'
import { reportService } from '../services/report.service.js'
import { response } from '../core/response.js'
import { asyncHandler } from '../controllers/base.controller.js'
import { validate } from '../middleware/validate.middleware.js'
import { reportListQuerySchema } from '../validators/report.validator.js'

const router = Router()

// GET /api/v1/reports — list reports with query filters
router.get('/', validate(reportListQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const data = await reportService.list(req.query)
  response.success(res, data)
}))

// GET /api/v1/reports/:slug — single report by slug
router.get('/:slug', asyncHandler(async (req, res) => {
  const data = await reportService.getBySlug(req.params.slug)
  response.success(res, data)
}))

export default router
