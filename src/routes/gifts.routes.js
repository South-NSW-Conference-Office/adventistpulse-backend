import { Router } from 'express'
import { validate } from '../middleware/validate.middleware.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requirePasswordChanged } from '../middleware/requirePasswordChanged.middleware.js'
import { requireApproved } from '../middleware/requireApproved.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { startAssessmentSchema, submitResponsesSchema } from '../validators/gifts.validator.js'
import { giftsController } from '../controllers/gifts.controller.js'

const router = Router()

/** Auth stack for protected endpoints */
const auth = [authMiddleware, requirePasswordChanged, requireApproved]

// ── Public endpoints ─────────────────────────────────────────────────────────

/** POST /api/v1/gifts/start — begin a new assessment (auth optional) */
router.post('/start', validate(startAssessmentSchema), giftsController.start)

/** POST /api/v1/gifts/submit — submit all responses and get scored result */
router.post('/submit', validate(submitResponsesSchema), giftsController.submit)

/** GET /api/v1/gifts/result/:token — get result by session token */
router.get('/result/:token', giftsController.result)

// ── Authenticated endpoints ──────────────────────────────────────────────────

/** POST /api/v1/gifts/claim/:token — claim anonymous result */
router.post('/claim/:token', auth, giftsController.claim)

/** GET /api/v1/gifts/my-assessments — list user's assessments */
router.get('/my-assessments', auth, giftsController.myAssessments)

/** GET /api/v1/gifts/church/:code/profile — church gift profile (pastor+) */
router.get('/church/:code/profile', auth, requireRole('pastor'), giftsController.churchProfile)

export default router
