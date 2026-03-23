import { Router } from 'express'
import { asyncHandler } from '../controllers/base.controller.js'
import { response }     from '../core/response.js'
import { User }         from '../models/User.js'
import { OrgUnit }      from '../models/OrgUnit.js'

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

export default router
