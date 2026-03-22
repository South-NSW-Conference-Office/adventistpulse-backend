import mongoose from 'mongoose';

/**
 * @typedef {Object} GooglePlacesCache
 * Cache for Google Places API data.
 * TTL: 30 days per entry. Fetched on-demand when a church page is visited.
 * Never batch-refresh the whole DB — let demand drive population.
 */
const GooglePlacesCacheSchema = new mongoose.Schema(
  {
    /** Lookup key: slugified church name + lat/lng hash */
    lookupKey: { type: String, required: true, unique: true, index: true },

    /** Google Place ID for future detail fetches */
    placeId: { type: String, default: null },

    /**
     * Set to true when Google returned no result for this lookup key.
     * Negative cache — avoids re-hitting Google for known-missing churches.
     * TTL is shorter (7 days) for not-found entries vs 30 days for hits.
     */
    notFound: { type: Boolean, default: false },

    /** Display data */
    rating:             { type: Number, default: null },
    reviewCount:        { type: Number, default: null },
    /**
     * Number of photo previews Google returned for this place.
     * Google caps the photos array at 10 regardless of actual photo count,
     * so this reflects "previews available", not total photos at the church.
     */
    photosPreviewCount: { type: Number, default: null },
    phone:              { type: String, default: null },
    googleMapsUrl:      { type: String, default: null },

    /** When this record was last fetched from Google */
    fetchedAt: { type: Date, required: true, default: Date.now },

    /** Auto-expire after 30 days (MongoDB TTL index) */
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true },
);

export default mongoose.model('GooglePlacesCache', GooglePlacesCacheSchema);
