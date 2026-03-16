import { Router } from 'express'
import mongoose from 'mongoose'
import { entityService } from '../services/entity.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireApproved } from '../middleware/requireApproved.middleware.js'
import { requirePasswordChanged } from '../middleware/requirePasswordChanged.middleware.js'
import { response } from '../core/response.js'
import { asyncHandler } from '../controllers/base.controller.js'

const router = Router()

// Lazy-load Entity to avoid circular import issues at startup
const getEntity = () => mongoose.model('Entity')

// ─── Public search — registered BEFORE :code to avoid route shadowing ────────

router.get('/search', asyncHandler(async (req, res) => {
  const { q, limit } = req.query
  if (!q) return response.success(res, [])
  const data = await entityService.search(q, limit)
  response.success(res, data)
}))

/**
 * GET /api/v1/entities/divisions
 * Returns all 13 GC divisions + attached fields (direct children of GC).
 * Public — no auth required.
 */
router.get('/divisions', async (req, res, next) => {
  try {
    const Entity = getEntity()
    const divisions = await Entity.find(
      { parentCode: 'GC', isActive: true },
      { _id: 1, name: 1, code: 1, level: 1 }
    ).sort({ name: 1 }).lean()
    res.json({ data: divisions })
  } catch (err) {
    next(err)
  }
})

// ─── :code sub-routes ────────────────────────────────────────────────────────

router.get('/:code/breadcrumbs', asyncHandler(async (req, res) => {
  const data = await entityService.getBreadcrumbs(req.params.code)
  response.success(res, data)
}))

router.get('/:code/siblings', asyncHandler(async (req, res) => {
  const data = await entityService.getSiblings(req.params.code)
  response.success(res, data)
}))

router.get('/:code/nearby', asyncHandler(async (req, res) => {
  const data = await entityService.getNearby(req.params.code, req.query.limit)
  response.success(res, data)
}))

router.get('/:code/benchmarks', authMiddleware, requirePasswordChanged, requireApproved, asyncHandler(async (req, res) => {
  const data = await entityService.getBenchmarks(req.params.code)
  response.success(res, data)
}))

/**
 * GET /api/v1/entities/:code/children
 * Returns direct children of any entity (unions under a division, conferences under a union, etc.)
 * Public — no auth required.
 */
router.get('/:code/children', async (req, res, next) => {
  try {
    const Entity = getEntity()
    const { code } = req.params
    const parent = await Entity.findOne({ code: code.toUpperCase() }, { _id: 1, code: 1 }).lean()
      ?? await Entity.findOne({ code }, { _id: 1, code: 1 }).lean()

    if (!parent) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Entity not found' } })
    }

    const children = await Entity.find(
      { parentCode: parent.code, isActive: true },
      { _id: 1, name: 1, code: 1, level: 1 }
    ).sort({ name: 1 }).lean()

    res.json({ data: children })
  } catch (err) {
    next(err)
  }
})

export default router
