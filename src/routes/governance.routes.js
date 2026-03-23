/**
 * ─── Governance Routes ────────────────────────────────────────────────────────
 *
 * Tracks constituency sessions, governing constitution documents, and session
 * booklets for each SDA entity.
 *
 * Public endpoints (no auth):
 *   GET  /api/v1/governance/:entityCode/sessions          — list all sessions
 *   GET  /api/v1/governance/:entityCode/sessions/latest   — latest session + next estimate
 *
 * Member-only endpoints (auth required, any role >= member):
 *   GET  /api/v1/governance/:entityCode/constitution      — get current constitution doc
 *   GET  /api/v1/governance/:entityCode/booklets          — list approved session booklets
 *   POST /api/v1/governance/:entityCode/booklets          — submit a new booklet for review
 *
 * Admin-only endpoints (auth required, role >= admin):
 *   POST /api/v1/governance/:entityCode/sessions                  — create a session record
 *   PUT  /api/v1/governance/:entityCode/sessions/:id              — update a session record
 *   POST /api/v1/governance/:entityCode/constitution              — add a new constitution version
 *   PUT  /api/v1/governance/:entityCode/booklets/:id/review       — approve or reject a booklet
 *
 * NOTE: Entity-scoped admin checks (e.g. only SNSW admin can write SNSW data)
 * are not yet implemented — deferred until entity-scoped roles are built.
 * TODO: Add entity-scoped permission middleware when conf/union admin roles land.
 */

import { Router } from 'express'
import { asyncHandler }            from '../controllers/base.controller.js'
import { authMiddleware }          from '../middleware/auth.middleware.js'
import { requireRole }             from '../middleware/role.middleware.js'
import { requirePasswordChanged }  from '../middleware/requirePasswordChanged.middleware.js'
import { requireApproved }         from '../middleware/requireApproved.middleware.js'
import { validate }                from '../middleware/validate.middleware.js'
import { response }                from '../core/response.js'
import { NotFoundError, ValidationError } from '../core/errors/index.js'
import {
  sessionRepository,
  constitutionDocumentRepository,
  sessionBookletRepository,
} from '../repositories/governance.repository.js'
import {
  createSessionSchema,
  updateSessionSchema,
  createConstitutionSchema,
  submitBookletSchema,
  reviewBookletSchema,
} from '../validators/governance.validator.js'

const router = Router()

// ─── Shared auth chains ───────────────────────────────────────────────────────
const memberAuth = [authMiddleware, requirePasswordChanged, requireApproved, requireRole('member')]
const adminAuth  = [authMiddleware, requirePasswordChanged, requireApproved, requireRole('admin')]

// ─── Sessions (public) ────────────────────────────────────────────────────────

/**
 * GET /api/v1/governance/:entityCode/sessions
 * List all sessions for an entity, newest first.
 */
router.get('/:entityCode/sessions', asyncHandler(async (req, res) => {
  const sessions = await sessionRepository.findByEntityCode(req.params.entityCode)
  response.success(res, sessions)
}))

/**
 * GET /api/v1/governance/:entityCode/sessions/latest
 * Returns the latest session record including next-cycle estimate.
 * Note: sessions with dateHeld=null (future/estimated) are returned via a
 * separate secondary sort on createdAt so they surface correctly.
 */
router.get('/:entityCode/sessions/latest', asyncHandler(async (req, res) => {
  const session = await sessionRepository.findLatest(req.params.entityCode)
  if (!session) throw new NotFoundError('Session')
  response.success(res, session)
}))

// ─── Sessions (admin write) ───────────────────────────────────────────────────

/**
 * POST /api/v1/governance/:entityCode/sessions
 * Create a new session record for an entity.
 */
router.post('/:entityCode/sessions', adminAuth, validate(createSessionSchema), asyncHandler(async (req, res) => {
  const entityCode = req.params.entityCode.toUpperCase()
  const session = await sessionRepository.create({ ...req.body, entityCode })
  response.created(res, session)
}))

/**
 * PUT /api/v1/governance/:entityCode/sessions/:id
 * Update an existing session record. Scoped to entityCode to prevent cross-entity mutation.
 */
router.put('/:entityCode/sessions/:id', adminAuth, validate(updateSessionSchema), asyncHandler(async (req, res) => {
  const entityCode = req.params.entityCode.toUpperCase()
  const session = await sessionRepository.updateByIdAndEntityCode(req.params.id, entityCode, req.body)
  if (!session) throw new NotFoundError('Session')
  response.success(res, session)
}))

// ─── Constitution Document ────────────────────────────────────────────────────

/**
 * GET /api/v1/governance/:entityCode/constitution
 * Retrieve the current constitution document for an entity.
 * Enforces accessLevel: 'admin'-level docs require admin auth; 'public' docs
 * are served to any member; 'member' docs require member auth (default).
 */
router.get('/:entityCode/constitution', memberAuth, asyncHandler(async (req, res) => {
  const doc = await constitutionDocumentRepository.findByEntityCode(req.params.entityCode)
  if (!doc) throw new NotFoundError('ConstitutionDocument')

  // Enforce document-level access control
  // 'admin'-level docs are only visible to admin (or above); treat as not found to avoid info leak
  const ADMIN_ROLES = new Set(['admin'])
  if (doc.accessLevel === 'admin' && !ADMIN_ROLES.has(req.user?.role)) {
    throw new NotFoundError('ConstitutionDocument')
  }

  response.success(res, doc)
}))

/**
 * POST /api/v1/governance/:entityCode/constitution
 * Add a new constitution version for an entity (admin only).
 * Previous versions are retained for history; findByEntityCode always returns the latest.
 * Expects: { title, version, effectiveDate, fileUrl, fileSizeBytes, mimeType,
 *            accessLevel, acncDocumentUrl, source, notes }
 */
router.post('/:entityCode/constitution', adminAuth, validate(createConstitutionSchema), asyncHandler(async (req, res) => {
  const entityCode = req.params.entityCode.toUpperCase()
  const uploadedBy = req.user?.id ?? 'system'
  const doc = await constitutionDocumentRepository.create({ ...req.body, entityCode, uploadedBy })
  response.created(res, doc)
}))

// ─── Session Booklets ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/governance/:entityCode/booklets
 * List all approved session booklets for an entity (member only).
 */
router.get('/:entityCode/booklets', memberAuth, asyncHandler(async (req, res) => {
  const booklets = await sessionBookletRepository.findApprovedByEntityCode(req.params.entityCode)
  response.success(res, booklets)
}))

/**
 * POST /api/v1/governance/:entityCode/booklets
 * Submit a booklet for admin review (member only).
 * Expects: { title, description, fileUrl, fileSizeBytes, mimeType, sessionRef?, accessLevel }
 */
router.post('/:entityCode/booklets', memberAuth, validate(submitBookletSchema), asyncHandler(async (req, res) => {
  const entityCode  = req.params.entityCode.toUpperCase()
  const submittedBy = req.user?.id
  const booklet = await sessionBookletRepository.create({
    ...req.body,
    entityCode,
    submittedBy,
    submittedAt: new Date(),
    status: 'pending',  // always override — members cannot self-approve
  })
  response.created(res, booklet)
}))

/**
 * PUT /api/v1/governance/:entityCode/booklets/:id/review
 * Approve or reject a submitted booklet (admin only).
 * Scoped to entityCode to prevent cross-entity mutation.
 * Expects: { status: 'approved' | 'rejected', reviewNotes? }
 */
router.put('/:entityCode/booklets/:id/review', adminAuth, validate(reviewBookletSchema), asyncHandler(async (req, res) => {
  const entityCode = req.params.entityCode.toUpperCase()
  const { status, reviewNotes } = req.body

  const booklet = await sessionBookletRepository.updateByIdAndEntityCode(req.params.id, entityCode, {
    status,
    reviewNotes,
    reviewedBy: req.user?.id,
    reviewedAt: new Date(),
  })

  if (!booklet) throw new NotFoundError('SessionBooklet')
  response.success(res, booklet)
}))

export default router
