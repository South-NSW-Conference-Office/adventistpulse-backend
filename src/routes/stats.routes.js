import { Router } from 'express'
import { statsController } from '../controllers/stats.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requireVerified } from '../middleware/requireVerified.middleware.js'
import { requirePasswordChanged } from '../middleware/requirePasswordChanged.middleware.js'
import { requireRole } from '../middleware/role.middleware.js'
import { validate } from '../middleware/validate.middleware.js'
import { importStatsSchema, rankingsQuerySchema, countryRankingsQuerySchema, mapDataQuerySchema, countryTrendQuerySchema, countrySummaryQuerySchema } from '../validators/stats.validator.js'

const router = Router()

router.use(authMiddleware, requirePasswordChanged)

router.get ('/map-data',         validate(mapDataQuerySchema, 'query'),           statsController.getMapData)
router.get ('/country-trend',    validate(countryTrendQuerySchema, 'query'),     statsController.getCountryTrend)
router.get ('/country-summary',  validate(countrySummaryQuerySchema, 'query'),   statsController.getCountrySummary)
router.get ('/rankings',         validate(rankingsQuerySchema, 'query'),         statsController.getRankings)
router.get ('/country-rankings', validate(countryRankingsQuerySchema, 'query'),  statsController.getCountryRankings)
router.get ('/entity/:code',                                                   statsController.getForEntity)
router.get ('/entity/:code/projections',                                       statsController.getProjections)
router.post('/import',     requireVerified, requireRole('admin'), validate(importStatsSchema), statsController.importStats)

export default router
