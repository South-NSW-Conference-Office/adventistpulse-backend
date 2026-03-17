import { Router } from 'express'
import { entityService } from '../services/entity.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireApproved } from '../middleware/requireApproved.middleware.js'
import { requirePasswordChanged } from '../middleware/requirePasswordChanged.middleware.js'
import { response } from '../core/response.js'
import { asyncHandler } from '../controllers/base.controller.js'

const router = Router()

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
router.get('/divisions', asyncHandler(async (req, res) => {
  const data = await entityService.getChildren('GC')
  response.success(res, data)
}))

// ─── List all entities ───────────────────────────────────────────────────────

router.get('/', asyncHandler(async (req, res) => {
  const data = await entityService.list(req.query)
  response.success(res, data)
}))

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
router.get('/:code/children', asyncHandler(async (req, res) => {
  const data = await entityService.getChildren(req.params.code)
  response.success(res, data)
}))

router.get('/:code/churches', asyncHandler(async (req, res) => {
  const { OrgUnit } = await import('../models/OrgUnit.js')
  const churches = await OrgUnit.find({
    level: 'church',
    parentCode: req.params.code.toUpperCase(),
  }).lean()
  response.success(res, churches)
}))

// ─── Get single entity by code (must be LAST to avoid shadowing sub-routes) ──

router.get('/:code', asyncHandler(async (req, res) => {
  const data = await entityService.getByCode(req.params.code)
  response.success(res, data)
}))

export default router
