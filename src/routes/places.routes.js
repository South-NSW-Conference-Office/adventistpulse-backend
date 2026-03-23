import { Router } from 'express'
import { asyncHandler } from '../controllers/base.controller.js'
import { validate } from '../middleware/validate.middleware.js'
import { churchPlacesRateLimit } from '../middleware/rateLimit.middleware.js'
import { getChurchPlacesData } from '../services/googlePlaces.service.js'
import { churchPlacesQuerySchema } from '../validators/places.validator.js'

const router = Router()

/**
 * GET /api/v1/places/church
 * On-demand Google Places lookup with 30-day cache.
 * Public — no auth required (read-only, cached, no sensitive data).
 * Rate limited: 30 req/min per IP (churchPlacesRateLimit).
 *
 * Query params:
 *   name    {string}  Church name (required, max 200 chars)
 *   lat     {number}  Latitude (optional — improves match accuracy)
 *   lng     {number}  Longitude (optional — improves match accuracy)
 *   address {string}  Optional street address (improves match accuracy)
 *
 * Response:
 *   { rating, reviewCount, photosPreviewCount, phone, googleMapsUrl, placeId, fromCache }
 */
router.get(
  '/church',
  churchPlacesRateLimit,
  validate(churchPlacesQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { name, lat, lng, address = '' } = req.query

    // lat/lng are coerced to numbers (or undefined) by Zod validation above
    const data = await getChurchPlacesData({ name, lat, lng, address })

    // Explicit 404 when Google found no match — avoids client receiving literal `null` body
    if (data === null) {
      return res.status(404).json({ found: false, message: 'No Google Places match for this church' })
    }

    return res.json(data)
  }),
)

export default router
