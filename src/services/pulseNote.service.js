/**
 * PulseNote Service — weekly Sabbath check-in business logic.
 *
 * All upserts use findOneAndUpdate with { upsert: true } to guarantee
 * exactly one document per church per week (enforced by compound unique index).
 */

import PulseNote from '../models/PulseNote.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive an ISO-style week key ('YYYY-WNN') from a given date.
 * Used to enforce the one-note-per-church-per-week constraint.
 *
 * @param {string|Date} date - Sabbath date
 * @returns {string} weekKey e.g. '2026-W12'
 */
function toWeekKey(date) {
  const d     = new Date(date)
  const year  = d.getFullYear()
  const start = new Date(year, 0, 1)
  const week  = Math.ceil(((d - start) / 86400000 + start.getDay() + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

// ─── PulseNote Service ────────────────────────────────────────────────────────

export const pulseNoteService = {

  /**
   * Submit or update a pulse note for a church week.
   * Uses findOneAndUpdate with upsert to ensure one note per church per week.
   * If a note already exists for the (churchCode, weekKey) pair it is updated
   * in-place; otherwise a new document is created.
   *
   * @param {object} params
   * @param {string}   params.churchCode    - Uppercase church code e.g. 'SNSW-CANB'
   * @param {string}   params.userId        - ObjectId of the submitting user
   * @param {string}   params.date          - ISO date string 'YYYY-MM-DD'
   * @param {object}  [params.attendance]   - { adults, youth, total }
   * @param {number}  [params.visitors]
   * @param {number}  [params.decisions]
   * @param {string[]}[params.specialEvents]
   * @param {string}  [params.notes]
   * @returns {Promise<object>} The upserted PulseNote document
   */
  async upsertPulseNote({ churchCode, userId, date, attendance, visitors, decisions, specialEvents, notes }) {
    const weekKey = toWeekKey(date)
    const code    = churchCode.toUpperCase()

    const update = {
      $set: {
        submittedBy:   userId,
        date:          new Date(date),
        weekKey,
        editedAt:      new Date(),
        ...(attendance    !== undefined && { attendance }),
        ...(visitors      !== undefined && { visitors }),
        ...(decisions     !== undefined && { decisions }),
        ...(specialEvents !== undefined && { specialEvents }),
        ...(notes         !== undefined && { notes }),
      },
      $setOnInsert: {
        churchCode: code,
      },
    }

    const doc = await PulseNote.findOneAndUpdate(
      { churchCode: code, weekKey },
      update,
      { upsert: true, new: true, runValidators: true }
    )

    return doc
  },

  /**
   * Get recent pulse notes for a church (last N weeks), sorted newest first.
   *
   * @param {string} churchCode - Church code to query
   * @param {number} [limit=12] - Maximum number of notes to return
   * @returns {Promise<object[]>}
   */
  async getChurchNotes(churchCode, limit = 12) {
    return PulseNote.find({ churchCode: churchCode.toUpperCase() })
      .sort({ date: -1 })
      .limit(limit)
      .populate('submittedBy', 'name email')
      .lean()
  },

  /**
   * Get all churches' latest notes for a conference.
   * Used by the conference admin dashboard to see recent activity across all
   * assigned churches at a glance. Returns up to `limit` notes per church,
   * sorted newest first.
   *
   * @param {string[]} churchCodes - Array of church codes to query
   * @param {number}   [limit=5]   - Notes per church
   * @returns {Promise<object[]>}
   */
  async getConferenceNotes(churchCodes, limit = 5) {
    const codes = churchCodes.map(c => c.toUpperCase())

    // Fetch the latest `limit` notes per church in parallel
    const results = await Promise.all(
      codes.map(code =>
        PulseNote.find({ churchCode: code })
          .sort({ date: -1 })
          .limit(limit)
          .populate('submittedBy', 'name email')
          .lean()
      )
    )

    // Flatten into a single array, preserving church grouping metadata
    return results.flat()
  },

  /**
   * Get notes submitted by a specific user, sorted newest first.
   *
   * @param {string} userId     - ObjectId of the user
   * @param {number} [limit=20] - Maximum number of notes to return
   * @returns {Promise<object[]>}
   */
  async getUserNotes(userId, limit = 20) {
    return PulseNote.find({ submittedBy: userId })
      .sort({ date: -1 })
      .limit(limit)
      .lean()
  },

}
