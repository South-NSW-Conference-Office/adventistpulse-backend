import { Router } from 'express'
import { entityController } from '../controllers/entity.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireVerified } from '../middleware/requireVerified.middleware.js'
import { requirePasswordChanged } from '../middleware/requirePasswordChanged.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { createEntitySchema, updateEntitySchema } from '../validators/entity.validator.js'

const router = Router()

router.use(authMiddleware, requirePasswordChanged)

// Read — any authenticated user (unverified OK for read-only)
router.get   ('/',               entityController.list)
router.get   ('/:code',          entityController.getOne)
router.get   ('/:code/children', entityController.getChildren)

// Write — must be verified + correct role
router.post  ('/',               requireVerified, requireRole('admin'),           validate(createEntitySchema), entityController.create)
router.put   ('/:code',          requireVerified, requireRole('admin', 'editor'), validate(updateEntitySchema), entityController.update)
router.delete('/:code',          requireVerified, requireRole('admin'),           entityController.delete)

export default router
