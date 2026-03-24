import mongoose from 'mongoose'

const orgUnitSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  level: {
    type: String,
    required: true,
    enum: ['gc', 'division', 'union', 'conference', 'church'],
  },
  parentCode: { type: String, default: null, uppercase: true },
  metadata: {
    region: String,
    country: String,
    established: Number,
    website: String,
    emailDomain: String,  // primary email domain for this territory (e.g. "adventist.org.au")
  },

  // ─── Org Structure Config ──────────────────────────────────────────────────
  // Controls which hierarchy levels are active for this entity's territory.
  // Allows the admin dashboard to hide levels that don't exist (e.g. Norway
  // has no conference tier — union manages churches directly).
  levelConfig: {
    conference: { type: Boolean, default: true },   // false = union manages churches directly
    region:     { type: Boolean, default: false },  // true = North/South regions used instead
    district:   { type: Boolean, default: false },  // true = Philippines-style district layer
  },

  // Configurable display labels for each level (defaults to standard names).
  // e.g. some territories say "Mission" instead of "Conference",
  // or "Section" instead of "District".
  levelLabels: {
    conference: { type: String, default: 'Conference' },
    region:     { type: String, default: 'Region' },
    district:   { type: String, default: 'District' },
    church:     { type: String, default: 'Church' },
  },
  location: {
    type:        { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },  // GeoJSON: [lng, lat]
    // Human-readable address — replaces display_name from entity-locations.json
    displayName: { type: String, default: null },
    // Where the coordinates came from — audit trail for Finn's location corrections.
    // null = unknown/legacy; omitted from enum so Mongoose doesn't reject null on save.
    source:      { type: String, enum: ['yearbook', 'nominatim', 'manual', 'finn-audit'], default: null },
    verifiedAt:  { type: Date, default: null },
  },

  // ─── Deduplication / Alias System ─────────────────────────────────────────
  // A single real-world entity may have been recorded under multiple codes
  // across different data sources. The canonical code is the primary identifier.
  // All other codes are stored as aliases so old links and data continue to resolve.
  aliases:      { type: [String], default: [] },          // e.g. ['GSYD', 'C10174']
  hidden:       { type: Boolean,  default: false },        // true = not visible on platform
  hiddenReason: { type: String,   default: null },         // why this entity is hidden
  canonicalCode:{ type: String,   default: null },         // if hidden, points to the canonical
}, { timestamps: true })

// code: unique:true on the field already creates the index — no need for schema.index()
orgUnitSchema.index({ parentCode: 1, level: 1 })
orgUnitSchema.index({ level: 1 })  // church.routes + signal.job query by level alone
orgUnitSchema.index({ aliases: 1 }) // alias fallback lookup in entity.repository.findByCode
orgUnitSchema.index({ location: '2dsphere' }, { sparse: true })

export const OrgUnit = mongoose.model('OrgUnit', orgUnitSchema)
