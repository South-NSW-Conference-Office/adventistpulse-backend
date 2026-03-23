/**
 * PulseNote — weekly Sabbath check-in data for a local church.
 * One note per church per week (upsert on churchCode + weekKey).
 */
import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema({
  adults: { type: Number, min: 0, default: null },
  youth:  { type: Number, min: 0, default: null },
  total:  { type: Number, min: 0, default: null },
}, { _id: false })

const pulseNoteSchema = new mongoose.Schema({
  churchCode:    { type: String, required: true, trim: true, uppercase: true },
  submittedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date:          { type: Date,   required: true },   // exact Sabbath date
  weekKey:       { type: String, required: true },   // 'YYYY-WNN' e.g. '2026-W12'
  attendance:    { type: attendanceSchema, default: {} },
  visitors:      { type: Number, min: 0, default: null },
  decisions:     { type: Number, min: 0, default: null },
  specialEvents: [{ type: String, enum: ['communion', 'pathfinders', 'evangelism', 'baptism', 'other'] }],
  notes:         { type: String, maxlength: 2000, default: '' },
  editedAt:      { type: Date },
}, {
  timestamps: true,
})

// One note per church per week
pulseNoteSchema.index({ churchCode: 1, weekKey: 1 }, { unique: true })
// Fast lookup by church
pulseNoteSchema.index({ churchCode: 1, date: -1 })
// Fast lookup by user
pulseNoteSchema.index({ submittedBy: 1, date: -1 })

export default mongoose.model('PulseNote', pulseNoteSchema)
