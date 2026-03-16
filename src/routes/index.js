import { Router } from 'express'
import authRoutes        from './auth.routes.js'
import entityRoutes      from './entity.routes.js'
import statsRoutes       from './stats.routes.js'
import adminRoutes       from './admin.routes.js'
import onboardingRoutes  from './onboarding.routes.js'
import riskRoutes        from './risk.routes.js'
import pulseRoutes       from './pulse.routes.js'

const router = Router()

router.use('/v1/auth',        authRoutes)
router.use('/v1/entities',    entityRoutes)
router.use('/v1/stats',       statsRoutes)
router.use('/v1/admin',       adminRoutes)
router.use('/v1/onboarding',  onboardingRoutes)
router.use('/v1/risk',        riskRoutes)
router.use('/v1/pulse',       pulseRoutes)

export default router
