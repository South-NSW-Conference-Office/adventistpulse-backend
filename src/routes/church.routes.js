import { Router } from 'express'
import { OrgUnit } from '../models/OrgUnit.js'
import { response } from '../core/response.js'
import { asyncHandler } from '../controllers/base.controller.js'

const router = Router()

// GET /api/v1/churches — all AU churches
router.get('/', asyncHandler(async (req, res) => {
  const { conference, limit = 2000 } = req.query
  const filter = { level: 'church' }
  if (conference) filter.parentCode = conference.toUpperCase()
  const safeLimit = Math.min(Math.max(1, Number(limit) || 2000), 2000)
  const data = await OrgUnit.find(filter).limit(safeLimit).lean()
  response.success(res, data)
}))

// GET /api/v1/churches/:slug — single church by slug
router.get('/:slug/nearby', asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query
  const church = await OrgUnit.findOne({ level: 'church', slug: req.params.slug }).lean()
  if (!church) return response.notFound(res, `Church '${req.params.slug}'`)

  const [lng, lat] = church.location?.coordinates ?? []
  if (!lng || !lat) return response.success(res, [])

  const nearby = await OrgUnit.find({
    level: 'church',
    slug: { $ne: req.params.slug },
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: 50000, // 50km
      },
    },
  }).limit(Math.min(Math.max(1, Number(limit) || 5), 20)).lean()

  // Add distanceKm approx
  const withDist = nearby.map(c => {
    const [cLng, cLat] = c.location?.coordinates ?? []
    const dLat = (cLat - lat) * (Math.PI / 180)
    const dLng = (cLng - lng) * (Math.PI / 180)
    const a = Math.sin(dLat/2)**2 + Math.cos(lat * Math.PI/180) * Math.cos(cLat * Math.PI/180) * Math.sin(dLng/2)**2
    const distanceKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10
    return { ...c, distanceKm }
  })

  response.success(res, withDist)
}))

router.get('/:slug', asyncHandler(async (req, res) => {
  const church = await OrgUnit.findOne({ level: 'church', slug: req.params.slug }).lean()
  if (!church) return response.notFound(res, `Church '${req.params.slug}'`)
  response.success(res, church)
}))

export default router
