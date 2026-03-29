import { Router } from 'express'
import invitationRoutes   from './invitation.routes.js'
import authRoutes         from './auth.routes.js'
import entityRoutes       from './entity.routes.js'
import statsRoutes        from './stats.routes.js'
import publicStatsRoutes  from './public-stats.routes.js'
import adminRoutes        from './admin.routes.js'
import onboardingRoutes   from './onboarding.routes.js'
import riskRoutes         from './risk.routes.js'
import pulseRoutes        from './pulse.routes.js'
import reportRoutes       from './report.routes.js'
import researchRoutes     from './research.routes.js'
import churchRoutes       from './church.routes.js'
import signalRoutes       from './signal.routes.js'
import institutionRoutes  from './institution.routes.js'
import { pastorSurveyRoutes, publicSurveyRoutes } from './survey.routes.js'
import surveyEngineRoutes from './surveyEngine.routes.js'
import placesRoutes       from './places.routes.js'
import pulseNotesRoutes   from './pulseNotes.routes.js'
import governanceRoutes   from './governance.routes.js'
import giftsRoutes        from './gifts.routes.js'

const router = Router()

// Invitation & personnel routes — flat mount (routes self-prefix /auth/* and /admin/*)
router.use('/v1', invitationRoutes)
router.use('/v1/auth',          authRoutes)
router.use('/v1/entities',      entityRoutes)
router.use('/v1/stats',         statsRoutes)
router.use('/v1/stats',         publicStatsRoutes)
router.use('/v1/admin',         adminRoutes)
router.use('/v1/onboarding',    onboardingRoutes)
router.use('/v1/risk',          riskRoutes)
router.use('/v1/pulse',         pulseRoutes)
router.use('/v1/reports',       reportRoutes)
router.use('/v1/research',      researchRoutes)
router.use('/v1/churches',      churchRoutes)
router.use('/v1/admin/signals', signalRoutes)
router.use('/v1/institutions',  institutionRoutes)
router.use('/v1/pastor/survey', pastorSurveyRoutes)
router.use('/v1/survey',        publicSurveyRoutes)
router.use('/v1/survey-engine', surveyEngineRoutes)
router.use('/v1/places',        placesRoutes)
router.use('/v1/notes',         pulseNotesRoutes)
router.use('/v1/governance',    governanceRoutes)
router.use('/v1/gifts',         giftsRoutes)

export default router
