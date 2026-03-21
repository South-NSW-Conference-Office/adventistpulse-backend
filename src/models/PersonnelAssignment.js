import mongoose from 'mongoose'

/**
 * PersonnelAssignment
 *
 * Records who pastored (or served in any paid ministry role at) a church,
 * and when. Completely separate from the User model — this covers:
 *   - Historical assignments before Pulse existed (CSV import)
 *   - Current assignments entered by conference admins
 *   - Future assignments (planned handovers)
 *
 * A single Person can have many rows (one per church, per tenure).
 * A single church can have many rows over time.
 *
 * This collection is the backbone of Personnel Intelligence:
 * tenure analysis, successor planning, and leadership effectiveness research.
 */
const personnelAssignmentSchema = new mongoose.Schema({

  // Link to User record if this person has a Pulse account.
  // Optional — historical imports won't always match a live user.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },

  // Human-readable name — always stored, even when userId is present,
  // so historical records remain legible if the user account is deleted.
  personName: { type: String, required: true, trim: true },

  // The church (or entity) this assignment is for.
  churchCode: { type: String, required: true, uppercase: true, trim: true, index: true },

  // Role held during this assignment.
  role: {
    type: String,
    enum: ['head-pastor', 'associate-pastor', 'bible-worker', 'chaplain', 'elder', 'district-leader'],
    required: true,
  },

  // Assignment dates. endDate null = currently serving.
  startDate: { type: Date, required: true },
  endDate:   { type: Date, default: null },

  // Which conference's admin entered this record.
  conferenceCode: { type: String, required: true, uppercase: true, trim: true, index: true },

  // How this record was created.
  source: {
    type: String,
    enum: ['admin-entry', 'csv-import', 'yearbook', 'system'],
    required: true,
    default: 'admin-entry',
  },

  // Who uploaded/entered this record (User ObjectId of the admin).
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Free-text notes — useful for context on historical imports.
  notes: { type: String, default: null, trim: true },

  // Soft-delete flag (don't destroy historical records, just hide them).
  isActive: { type: Boolean, default: true, index: true },

}, { timestamps: true })

// Compound indexes for the most common queries
personnelAssignmentSchema.index({ churchCode: 1, endDate: 1 })      // "who pastors X now?"
personnelAssignmentSchema.index({ conferenceCode: 1, endDate: 1 })  // "all current SNSW pastors"
personnelAssignmentSchema.index({ personName: 'text' })              // "search by pastor name"

export const PersonnelAssignment = mongoose.model('PersonnelAssignment', personnelAssignmentSchema)
