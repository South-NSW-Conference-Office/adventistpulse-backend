import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import asyncHandler from '../utils/asyncHandler.js';
import { getChurchPlacesData } from '../services/googlePlaces.service.js';

const router = Router();

/**
 * GET /api/v1/places/church
 * On-demand Google Places lookup with 30-day cache.
 * Public — no auth required (read-only, cached, no sensitive data).
 *
 * Query params:
 *   name  {string} Church name
 *   lat   {number} Latitude
 *   lng   {number} Longitude
 *   address {string} Optional street address (improves match accuracy)
 *
 * Response:
 *   { rating, reviewCount, photosCount, phone, googleMapsUrl, placeId, fromCache }
 */
router.get(
  '/church',
  [
    query('name').notEmpty().withMessage('name is required'),
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('valid lat required'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('valid lng required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, lat, lng, address = '' } = req.query;

    const data = await getChurchPlacesData({
      name,
      lat:  parseFloat(lat),
      lng:  parseFloat(lng),
      address,
    });

    return res.json(data);
  }),
);

export default router;
