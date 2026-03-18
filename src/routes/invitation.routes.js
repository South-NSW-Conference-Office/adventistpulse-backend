import { Router }              from 'express'
import multer                  from 'multer'
import { invitationController } from '../controllers/invitation.controller.js'
import { personnelController }  from '../controllers/personnel.controller.js'
import { authMiddleware }       from '../middleware/auth.middleware.js'
import { requireRole }          from '../middleware/role.middleware.js'
import { validate }             from '../middleware/validate.middleware.js'
import { resetPasswordRateLimit } from '../middleware/rateLimit.middleware.js'
import { nominateSchema, acceptInviteSchema, delegateSchema, assignmentSchema } from '../validators/invitation.validator.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

// ─── Public ───────────────────────────────────────────────────────────────────
// Accept invite — no auth required (user doesn't have a session yet).
// Rate-limited (same limits as resetPassword): 256-bit token makes brute force
// practically impossible, but a limiter is best practice for any unauthenticated write.
router.post('/auth/accept-invite', resetPasswordRateLimit, validate(acceptInviteSchema), invitationController.acceptInvite)

// ─── Admin routes — require auth + admin role ──────────────────────────────────
router.use('/admin', authMiddleware, requireRole('admin'))

// Invitation management
router.post  ('/admin/invite',               validate(nominateSchema),   invitationController.nominate)
router.get   ('/admin/invite/check-domain',                              invitationController.checkDomain)

// Personnel assignments
router.get   ('/admin/assignments',                                      personnelController.listCurrent)
router.get   ('/admin/assignments/church/:code',                         personnelController.churchHistory)
router.post  ('/admin/assignments',          validate(assignmentSchema), personnelController.create)
router.patch ('/admin/assignments/:id/end',                              personnelController.end)
router.post  ('/admin/assignments/import',   upload.single('file'),      personnelController.importCsv)

// ─── Pastor routes — require auth + pastor role ────────────────────────────────
router.use('/pastor', authMiddleware, requireRole('pastor'))

router.post  ('/pastor/delegate',                         validate(delegateSchema), personnelController.delegate)
router.delete('/pastor/delegate/:elderId/:churchCode',                              personnelController.revokeDelegate)

export default router
