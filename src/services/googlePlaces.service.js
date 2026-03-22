import GooglePlacesCache from '../models/GooglePlacesCache.js'
import { logger } from '../core/logger.js'
import { env } from '../config/env.js'

const PLACES_API_KEY = env.GOOGLE_PLACES_API_KEY
const TTL_DAYS = 30;

/**
 * Build a stable lookup key from church name + coordinates.
 * @param {string} name
 * @param {number} lat
 * @param {number} lng
 * @returns {string}
 */
function buildLookupKey(name, lat, lng) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const latR = Math.round(lat * 1000) / 1000;
  const lngR = Math.round(lng * 1000) / 1000;
  return `${slug}__${latR}_${lngR}`;
}

/**
 * Fetch Google Places data for a church.
 * Returns cached data if fresh, otherwise queries Google and caches result.
 *
 * @param {{ name: string, lat: number, lng: number, address?: string }} params
 * @returns {Promise<{ rating: number|null, reviewCount: number|null, placeId: string|null, phone: string|null, googleMapsUrl: string|null, fromCache: boolean }>}
 */
export async function getChurchPlacesData({ name, lat, lng, address = '' }) {
  const lookupKey = buildLookupKey(name, lat, lng);

  // ── 1. Check cache ────────────────────────────────────────────────────────
  const cached = await GooglePlacesCache.findOne({ lookupKey });
  if (cached) {
    return {
      rating:       cached.rating,
      reviewCount:  cached.reviewCount,
      photosCount:  cached.photosCount,
      phone:        cached.phone,
      googleMapsUrl:cached.googleMapsUrl,
      placeId:      cached.placeId,
      fromCache:    true,
    };
  }

  // ── 2. No cache or expired — fetch from Google ────────────────────────────
  if (!PLACES_API_KEY) {
    return { rating: null, reviewCount: null, photosCount: null, phone: null, googleMapsUrl: null, placeId: null, fromCache: false };
  }

  try {
    // Step 1: Find Place
    const nameQ = name.includes('Adventist') ? name : `${name} Adventist Church`;
    const query  = address ? `${nameQ}, ${address}` : nameQ;
    const findUrl = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
    findUrl.searchParams.set('input', query);
    findUrl.searchParams.set('inputtype', 'textquery');
    findUrl.searchParams.set('locationbias', `point:${lat},${lng}`);
    findUrl.searchParams.set('fields', 'place_id,name,rating,user_ratings_total');
    findUrl.searchParams.set('key', PLACES_API_KEY);

    const findRes   = await fetch(findUrl.toString());
    const findData  = await findRes.json();
    const candidate = findData.candidates?.[0] ?? null;

    let rating       = candidate?.rating       ?? null;
    let reviewCount  = candidate?.user_ratings_total ?? null;
    let placeId      = candidate?.place_id     ?? null;
    let phone        = null;
    let photosCount  = null;

    // Step 2: Place Details for phone + photos
    if (placeId) {
      const detUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
      detUrl.searchParams.set('place_id', placeId);
      detUrl.searchParams.set('fields', 'formatted_phone_number,photos,rating,user_ratings_total');
      detUrl.searchParams.set('key', PLACES_API_KEY);

      const detRes  = await fetch(detUrl.toString());
      const detData = await detRes.json();
      const result  = detData.result ?? {};

      rating      = result.rating               ?? rating;
      reviewCount = result.user_ratings_total   ?? reviewCount;
      phone       = result.formatted_phone_number ?? null;
      photosCount = result.photos?.length        ?? null;
    }

    const googleMapsUrl = placeId
      ? `https://www.google.com/maps/place/?q=place_id:${placeId}`
      : `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${lat},${lng},17z`;

    // ── 3. Store in cache ───────────────────────────────────────────────────
    const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
    await GooglePlacesCache.findOneAndUpdate(
      { lookupKey },
      { lookupKey, placeId, rating, reviewCount, photosCount, phone, googleMapsUrl, fetchedAt: new Date(), expiresAt },
      { upsert: true, new: true },
    );

    return { rating, reviewCount, photosCount, phone, googleMapsUrl, placeId, fromCache: false };
  } catch (err) {
    logger.error('[GooglePlaces] fetch error', err)
    return { rating: null, reviewCount: null, photosCount: null, phone: null, googleMapsUrl: null, placeId: null, fromCache: false }
  }
}
