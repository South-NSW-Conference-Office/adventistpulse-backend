import { Router } from 'express'
import { researchService } from '../services/research.service.js'
import { response } from '../core/response.js'
import { asyncHandler } from '../controllers/base.controller.js'
import { validate } from '../middleware/validate.middleware.js'
import { researchListQuerySchema } from '../validators/research.validator.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requirePasswordChanged } from '../middleware/requirePasswordChanged.middleware.js'
import { requireApproved } from '../middleware/requireApproved.middleware.js'

const router = Router()

/** Middleware stack for authenticated (any approved member) routes */
const memberAuth = [authMiddleware, requirePasswordChanged, requireApproved]

// ── Public routes ─────────────────────────────────────────────────────────────

// GET /api/v1/research — list research papers with query filters
router.get('/', validate(researchListQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const data = await researchService.list(req.query)
  response.success(res, data)
}))

// GET /api/v1/research/featured — featured papers only
router.get('/featured', asyncHandler(async (req, res) => {
  const data = await researchService.getFeatured()
  response.success(res, data)
}))

// GET /api/v1/research/:id — single paper metadata (no body — body is gated)
router.get('/:id', asyncHandler(async (req, res) => {
  const data = await researchService.getById(req.params.id)
  response.success(res, data)
}))

// ── Authenticated routes ───────────────────────────────────────────────────────

/**
 * GET /api/v1/research/:id/body
 * Returns the full markdown body of a research paper.
 * Requires a valid, approved, password-changed account (any tier).
 *
 * Response:
 *   { id, body }   — body is markdown string, may be null if not yet seeded
 *
 * Run scripts/seed-lrp-body.js to populate body text for all 208 papers.
 */
router.get('/:id/body', memberAuth, asyncHandler(async (req, res) => {
  const body = await researchService.getBody(req.params.id)
  response.success(res, body)
}))

export default router
