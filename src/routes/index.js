import { Router } from 'express'
import invitationRoutes  from './invitation.routes.js'
import authRoutes        from './auth.routes.js'
import entityRoutes      from './entity.routes.js'
import statsRoutes       from './stats.routes.js'
import adminRoutes       from './admin.routes.js'
import onboardingRoutes  from './onboarding.routes.js'
import riskRoutes        from './risk.routes.js'
import pulseRoutes       from './pulse.routes.js'
import reportRoutes      from './report.routes.js'
import researchRoutes    from './research.routes.js'
import churchRoutes      from './church.routes.js'

const router = Router()

// Invitation & personnel routes — flat mount (routes self-prefix /auth/* and /admin/*)
router.use('/v1', invitationRoutes)
router.use('/v1/auth',        authRoutes)
router.use('/v1/entities',    entityRoutes)
router.use('/v1/stats',       statsRoutes)
router.use('/v1/admin',       adminRoutes)
router.use('/v1/onboarding',  onboardingRoutes)
router.use('/v1/risk',        riskRoutes)
router.use('/v1/pulse',       pulseRoutes)
router.use('/v1/reports',     reportRoutes)
router.use('/v1/research',    researchRoutes)
router.use('/v1/churches',    churchRoutes)

export default router
