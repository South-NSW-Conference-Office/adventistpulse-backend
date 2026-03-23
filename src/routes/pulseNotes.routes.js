/**
 * Pulse Notes Routes — weekly Sabbath check-in API.
 *
 * POST   /api/v1/notes              — submit or update a pulse note
 * GET    /api/v1/notes/church/:code — get recent notes for a church
 * GET    /api/v1/notes/me           — get notes submitted by the current user
 * GET    /api/v1/notes/conference   — get latest notes across conference churches (admin/editor)
 *
 * All routes require authentication + password changed + account approved.
 */
import { Router }                  from 'express'
import { z }                       from 'zod'
import { asyncHandler }            from '../controllers/base.controller.js'
import { authMiddleware }          from '../middleware/auth.middleware.js'
import { requireApproved }         from '../middleware/requireApproved.middleware.js'
import { requirePasswordChanged }  from '../middleware/requirePasswordChanged.middleware.js'
import { requireRole }             from '../middleware/role.middleware.js'
import { validate }                from '../middleware/validate.middleware.js'
import { response }                from '../core/response.js'
import { pulseNoteService }        from '../services/pulseNote.service.js'
import { ForbiddenError }          from '../core/errors/index.js'

const router = Router()

// ─── Auth guard — all routes below require a valid, approved, password-changed session ───
router.use(authMiddleware, requirePasswordChanged, requireApproved)

// ─── Validators ───────────────────────────────────────────────────────────────

const submitNoteSchema = z.object({
  churchCode:    z.string().min(1).max(20),
  date:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  attendance: z.object({
    adults: z.number().int().min(0).nullable().optional(),
    youth:  z.number().int().min(0).nullable().optional(),
    total:  z.number().int().min(0).nullable().optional(),
  }).optional(),
  visitors:      z.number().int().min(0).nullable().optional(),
  decisions:     z.number().int().min(0).nullable().optional(),
  specialEvents: z.array(z.enum(['communion', 'pathfinders', 'evangelism', 'baptism', 'other'])).optional(),
  notes:         z.string().max(2000).optional(),
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if the user is an admin or editor (conference-level roles).
 *
 * @param {object} user - req.user
 * @returns {boolean}
 */
function isAdminOrEditor(user) {
  return user.role === 'admin' || user.role === 'editor'
}

/**
 * Returns true if the user is assigned to the given church.
 *
 * @param {object} user       - req.user
 * @param {string} churchCode - Uppercase church code
 * @returns {boolean}
 */
function isAssignedToChurch(user, churchCode) {
  const assigned = user.assignedChurches ?? []
  return assigned.some(c => c.toUpperCase() === churchCode.toUpperCase())
}

// ─── POST /api/v1/notes ───────────────────────────────────────────────────────

/**
 * Submit or update a pulse note for a church week.
 * The requesting user must be assigned to the church, or have admin/editor role.
 */
router.post(
  '/',
  validate(submitNoteSchema),
  asyncHandler(async (req, res) => {
    const { churchCode, date, attendance, visitors, decisions, specialEvents, notes } = req.body
    const user = req.user

    // Authorization: must be assigned to the church OR be admin/editor
    if (!isAssignedToChurch(user, churchCode) && !isAdminOrEditor(user)) {
      throw new ForbiddenError(`You are not assigned to church '${churchCode}'`)
    }

    const note = await pulseNoteService.upsertPulseNote({
      churchCode,
      userId: user._id,
      date,
      attendance,
      visitors,
      decisions,
      specialEvents,
      notes,
    })

    response.created(res, note)
  })
)

// ─── GET /api/v1/notes/me ─────────────────────────────────────────────────────

/**
 * Get the last 20 pulse notes submitted by the currently authenticated user.
 */
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const data = await pulseNoteService.getUserNotes(req.user._id)
    response.success(res, data)
  })
)

// ─── GET /api/v1/notes/conference ─────────────────────────────────────────────

/**
 * Get the latest pulse notes across a set of conference churches.
 * Query param: ?churches=SNSW-CANB,SNSW-WOLL (comma-separated church codes)
 * Restricted to admin and editor roles.
 */
router.get(
  '/conference',
  requireRole('editor'),
  asyncHandler(async (req, res) => {
    const raw = req.query.churches ?? ''
    const churchCodes = raw
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(Boolean)

    if (churchCodes.length === 0) {
      return response.success(res, [])
    }

    const data = await pulseNoteService.getConferenceNotes(churchCodes)
    response.success(res, data)
  })
)

// ─── GET /api/v1/notes/church/:code ──────────────────────────────────────────

/**
 * Get the last 12 pulse notes for a specific church.
 * The requesting user must be assigned to the church, or have admin/editor role.
 */
router.get(
  '/church/:code',
  asyncHandler(async (req, res) => {
    const churchCode = req.params.code.toUpperCase()
    const user       = req.user

    // Authorization: must be assigned to the church OR be admin/editor
    if (!isAssignedToChurch(user, churchCode) && !isAdminOrEditor(user)) {
      throw new ForbiddenError(`You are not assigned to church '${churchCode}'`)
    }

    const data = await pulseNoteService.getChurchNotes(churchCode)
    response.success(res, data)
  })
)

export default router
