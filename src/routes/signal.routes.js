import { Router }           from 'express'
import { signalController } from '../controllers/signal.controller.js'
import { authMiddleware }   from '../middleware/auth.middleware.js'
import { requireRole }      from '../middleware/role.middleware.js'
import { validate }         from '../middleware/validate.middleware.js'
import { listSignalsSchema, resolveSignalSchema } from '../validators/signal.validator.js'

const router = Router()

// All signal routes require auth + at minimum admin role
router.use(authMiddleware, requireRole('admin'))

// Intel Feed
router.get   ('/',                    validate(listSignalsSchema, 'query'), signalController.list)
router.get   ('/church/:code',        signalController.forChurch)
router.patch ('/:id/resolve',         validate(resolveSignalSchema),        signalController.resolve)

// Manual sweep trigger (admin only)
router.post  ('/sweep',               signalController.sweep)

export default router
