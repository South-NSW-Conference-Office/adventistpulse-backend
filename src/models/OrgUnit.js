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
  },
}, { timestamps: true })

// code: unique:true on the field already creates the index — no need for schema.index()
orgUnitSchema.index({ level: 1 })
orgUnitSchema.index({ parentCode: 1 })

export const OrgUnit = mongoose.model('OrgUnit', orgUnitSchema)
