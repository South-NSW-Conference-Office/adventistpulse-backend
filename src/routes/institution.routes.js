import { Router } from 'express'
import { institutionService } from '../services/institution.service.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireApproved } from '../middleware/requireApproved.middleware.js'
import { requirePasswordChanged } from '../middleware/requirePasswordChanged.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { response } from '../core/response.js'
import { asyncHandler } from '../controllers/base.controller.js'
import {
  institutionQuerySchema,
  createInstitutionSchema,
  updateInstitutionSchema,
  createACNCEntrySchema,
} from '../validators/institution.validator.js'

const router = Router()

// ─── Search (before :code to avoid route shadowing) ──────────────────────────

router.get('/search', asyncHandler(async (req, res) => {
  const { q, limit } = req.query
  if (!q) return response.success(res, [])
  const data = await institutionService.search(q, limit)
  response.success(res, data)
}))

// ─── ACNC transparency data (before /:code to avoid shadowing) ───────────────

router.get('/acnc', asyncHandler(async (req, res) => {
  const { financialYear, type } = req.query
  const data = await institutionService.listACNC({ financialYear, type })
  response.success(res, data)
}))

router.get('/acnc/:institutionCode', asyncHandler(async (req, res) => {
  const data = await institutionService.getACNCByInstitution(req.params.institutionCode)
  response.success(res, data)
}))

// ─── Get by type (before /:code to avoid shadowing) ──────────────────────────

router.get('/type/:type', asyncHandler(async (req, res) => {
  const data = await institutionService.getByType(req.params.type)
  response.success(res, data)
}))

// ─── List all institutions ────────────────────────────────────────────────────

router.get('/', asyncHandler(async (req, res) => {
  const params = institutionQuerySchema.parse(req.query)
  const result = await institutionService.list(params)
  response.success(res, result)
}))

// ─── Admin: create ACNC entry ─────────────────────────────────────────────────

router.post('/acnc',
  authMiddleware, requirePasswordChanged, requireApproved,
  validate(createACNCEntrySchema),
  asyncHandler(async (req, res) => {
    const { ACNCEntry } = await import('../models/ACNCEntry.js')
    const entry = new ACNCEntry(req.body)
    await entry.save()
    response.created(res, entry.toObject())
  })
)

// ─── Admin: create institution ────────────────────────────────────────────────

router.post('/',
  authMiddleware, requirePasswordChanged, requireApproved,
  validate(createInstitutionSchema),
  asyncHandler(async (req, res) => {
    const data = await institutionService.create(req.body)
    response.created(res, data)
  })
)

// ─── Admin: update institution ────────────────────────────────────────────────

router.put('/:code',
  authMiddleware, requirePasswordChanged, requireApproved,
  validate(updateInstitutionSchema),
  asyncHandler(async (req, res) => {
    const data = await institutionService.update(req.params.code, req.body)
    if (!data) return response.notFound(res, 'Institution not found')
    response.success(res, data)
  })
)

// ─── Admin: soft delete ───────────────────────────────────────────────────────

router.delete('/:code',
  authMiddleware, requirePasswordChanged, requireApproved,
  asyncHandler(async (req, res) => {
    await institutionService.delete(req.params.code)
    response.success(res, { deleted: true })
  })
)

// ─── Get single institution by code (LAST — avoids shadowing named routes) ───

router.get('/:code', asyncHandler(async (req, res) => {
  const data = await institutionService.getByCode(req.params.code)
  if (!data) return response.notFound(res, 'Institution not found')
  response.success(res, data)
}))

export default router
