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

    /** Display data */
    rating:       { type: Number, default: null },
    reviewCount:  { type: Number, default: null },
    photosCount:  { type: Number, default: null },
    phone:        { type: String, default: null },
    googleMapsUrl:{ type: String, default: null },

    /** When this record was last fetched from Google */
    fetchedAt: { type: Date, required: true, default: Date.now },

    /** Auto-expire after 30 days (MongoDB TTL index) */
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true },
);

export default mongoose.model('GooglePlacesCache', GooglePlacesCacheSchema);
