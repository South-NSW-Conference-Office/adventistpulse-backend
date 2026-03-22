import { Router } from 'express'
import { User } from '../models/User.js'

const router = Router()

/**
 * GET /api/v1/stats/public
 * Returns platform transparency counters — no auth required.
 * Powers the footer's 3 transparency stats: site visits, registered users, admin offices.
 *
 * Response: { siteVisits: number, registeredUsers: number, administrations: number }
 */
router.get('/public', async (req, res) => {
  try {
    const [registeredUsers, administrations] = await Promise.all([
      // Total registered users on the platform
      User.countDocuments({}),

      // Users with admin or editor roles — these are conference/union/division admin offices
      User.countDocuments({ role: { $in: ['admin', 'editor'] } }),
    ])

    // TODO: integrate a real analytics provider (e.g. Plausible, PostHog) and replace
    // this hardcoded value with actual page-view data.
    const siteVisits = 0

    return res.json({ siteVisits, registeredUsers, administrations })
  } catch (err) {
    console.error('[public-stats] Error fetching stats:', err)
    return res.status(500).json({ error: 'Failed to fetch public stats' })
  }
})

export default router
