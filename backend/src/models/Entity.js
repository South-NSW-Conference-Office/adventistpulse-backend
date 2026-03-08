import mongoose from 'mongoose'

/**
 * Entity — SDA organisational unit.
 * Covers GC → Division → Union → Conference/Mission/Field.
 * Uses adjacency list (parentId) + materialized path for efficient tree queries.
 */
const LEVELS = [
  'general_conference',
  'division',
  'union_conference',
  'union_mission',
  'union',              // generic (entities.json uses this)
  'conference',
  'mission',
  'attached_conference',
  'attached_mission',
  'attached_field',
  'attached_section',
  'gc_attached_union',
  'gc_attached_field',
  'field',
  'field_station',
  'section',
  'union_of_churches_conference',
  'union_of_churches_mission',
  'union_section',
  'region',
  'mission_field',
]

const entitySchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  code:       { type: String, required: true, trim: true, unique: true, uppercase: false },

  level: {
    type:     String,
    required: true,
    enum:     LEVELS,
  },

  // Tree structure
  parentCode: { type: String, default: null, trim: true },
  parentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Entity', default: null },
  path:       { type: String, required: true, index: true }, // e.g. "GC/SPD/AUC/GSC"

  isActive:   { type: Boolean, default: true },
}, {
  timestamps: true,
})

// Fast lookups
entitySchema.index({ code: 1 })
entitySchema.index({ parentCode: 1 })
entitySchema.index({ level: 1 })
entitySchema.index({ path: 1 })

export const Entity = mongoose.model('Entity', entitySchema)
