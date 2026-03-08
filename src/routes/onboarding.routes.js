import { Router }               from 'express'
import { onboardingController }  from '../controllers/onboarding.controller.js'
import { authMiddleware }        from '../middleware/auth.middleware.js'
import { requireVerified }       from '../middleware/requireVerified.middleware.js'
import { validate }              from '../middleware/validate.middleware.js'
import { onboardingSubmitSchema } from '../validators/onboarding.validator.js'

const router = Router()

// All onboarding routes require a verified email — unverified users can't submit
router.use(authMiddleware, requireVerified)

router.get  ('/',       onboardingController.getStatus)
router.post ('/submit', validate(onboardingSubmitSchema), onboardingController.submit)

export default router
