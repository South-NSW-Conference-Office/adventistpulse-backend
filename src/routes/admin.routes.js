import { Router } from 'express'
import { adminController } from '../controllers/admin.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { setActiveSchema, updateRoleSchema } from '../validators/admin.validator.js'
import { approvalActionSchema }              from '../validators/onboarding.validator.js'

const router = Router()

// All admin routes require auth + admin role
router.use(authMiddleware, requireRole('admin'))

router.get   ('/users',                      adminController.listUsers)
router.post  ('/users/:id/reset-password',   adminController.initiatePasswordReset)
router.patch ('/users/:id/active',           validate(setActiveSchema),   adminController.setUserActive)
router.patch ('/users/:id/role',             validate(updateRoleSchema),  adminController.updateUserRole)

// Onboarding approval queue
router.get   ('/approvals',                  adminController.listPendingApprovals)
router.post  ('/approvals/:id/approve',      adminController.approveUser)
router.post  ('/approvals/:id/reject',       validate(approvalActionSchema), adminController.rejectUser)

export default router
