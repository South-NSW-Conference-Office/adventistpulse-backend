import { Router }            from 'express'
import { asyncHandler }      from '../controllers/base.controller.js'
import { response }          from '../core/response.js'
import { User }              from '../models/User.js'
import { OrgUnit }           from '../models/OrgUnit.js'
import { getComputedStats }  from '../services/stats.service.js'

const router = Router()

/**
 * GET /api/v1/stats/public
 * Returns platform transparency counters — no auth required.
 * Powers the footer's 3 transparency stats: site visits, registered users, admin offices.
 *
 * Response: { siteVisits: number, registeredUsers: number, administrations: number }
 */
router.get('/public', asyncHandler(async (req, res) => {
  const [registeredUsers, administrations] = await Promise.all([
    // Total registered users on the platform
    User.countDocuments({}),

    // Count distinct admin-level org units (conference / union / division level entities)
    // This counts organisations, not user accounts — gives an accurate "admin offices" figure
    OrgUnit.countDocuments({
      hidden: { $ne: true },
      level:  { $in: ['conference', 'union', 'division', 'gc'] },
    }),
  ])

  // TODO: integrate a real analytics provider (e.g. Plausible, PostHog) and replace
  // this hardcoded value with actual page-view data.
  const siteVisits = 0

  response.success(res, { siteVisits, registeredUsers, administrations })
}))

/**
 * GET /api/v1/stats/country-growth
 * Returns country-level annualised membership growth rates.
 * Powers the Growth/Decline choropleth layer on the map.
 * Results are cached for 24 hours and rebuilt in the background when stale.
 *
 * Response: { builtAt, fresh, data: [{ country, growthRate, latestYear, ... }] }
 */
router.get('/country-growth', asyncHandler(async (req, res) => {
  const forceRebuild = req.query.rebuild === 'true' && req.query.secret === process.env.STATS_REBUILD_SECRET
  const result = await getComputedStats('country-growth', forceRebuild)
  response.success(res, result)
}))

/**
 * GET /api/v1/stats/country-membership
 * Returns latest known membership totals per country.
 * Powers the Adventist Density choropleth layer on the map.
 *
 * Response: { builtAt, fresh, data: [{ country, membership, latestYear }] }
 */
router.get('/country-membership', asyncHandler(async (req, res) => {
  const forceRebuild = req.query.rebuild === 'true' && req.query.secret === process.env.STATS_REBUILD_SECRET
  const result = await getComputedStats('country-membership', forceRebuild)
  response.success(res, result)
}))

export default router
