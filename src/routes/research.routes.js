import { Router } from 'express'
import { researchService } from '../services/research.service.js'
import { response } from '../core/response.js'
import { asyncHandler } from '../controllers/base.controller.js'

const router = Router()

// GET /api/v1/research — list research papers with query filters
router.get('/', asyncHandler(async (req, res) => {
  const data = await researchService.list(req.query)
  response.success(res, data)
}))

// GET /api/v1/research/featured — featured papers only
router.get('/featured', asyncHandler(async (req, res) => {
  const data = await researchService.getFeatured()
  response.success(res, data)
}))

// GET /api/v1/research/:id — single paper by string id
router.get('/:id', asyncHandler(async (req, res) => {
  const data = await researchService.getById(req.params.id)
  response.success(res, data)
}))

export default router
