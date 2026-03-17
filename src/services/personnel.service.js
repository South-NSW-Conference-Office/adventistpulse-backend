/**
 * Personnel Service
 *
 * Manages pastoral assignments — current and historical.
 * This is the data pipeline for Personnel Intelligence:
 * every assignment entered here feeds tenure analysis and
 * leadership effectiveness research.
 */

import { parse as csvParse } from 'csv-parse/sync'
import { PersonnelAssignment } from '../models/PersonnelAssignment.js'
import { User } from '../models/User.js'
import { logger } from '../core/logger.js'

export const personnelService = {

  /**
   * List all current assignments for a conference.
   * "Current" = endDate is null (still serving).
   */
  async listCurrent(conferenceCode) {
    return PersonnelAssignment.find({
      conferenceCode: conferenceCode.toUpperCase(),
      endDate: null,
      isActive: true,
    }).sort({ churchCode: 1, startDate: -1 }).lean()
  },

  /**
   * List full history for a specific church.
   */
  async churchHistory(churchCode) {
    return PersonnelAssignment.find({
      churchCode: churchCode.toUpperCase(),
      isActive: true,
    }).sort({ startDate: -1 }).lean()
  },

  /**
   * Create a single assignment (admin UI — add/edit one record).
   */
  async createAssignment({
    personName, churchCode, role, startDate, endDate,
    conferenceCode, uploadedBy, notes,
  }) {
    // Try to link to existing User account by name (fuzzy — admin can correct)
    const matchedUser = await User.findOne({
      name: { $regex: new RegExp(`^${personName.trim()}$`, 'i') },
    }).select('_id').lean()

    return PersonnelAssignment.create({
      userId:         matchedUser?._id ?? null,
      personName:     personName.trim(),
      churchCode:     churchCode.toUpperCase(),
      role,
      startDate:      new Date(startDate),
      endDate:        endDate ? new Date(endDate) : null,
      conferenceCode: conferenceCode.toUpperCase(),
      source:         'admin-entry',
      uploadedBy,
      notes: notes ?? null,
    })
  },

  /**
   * End a current assignment (set endDate to today).
   */
  async endAssignment(assignmentId, uploadedBy) {
    const a = await PersonnelAssignment.findById(assignmentId)
    if (!a) throw new Error('Assignment not found')
    if (a.endDate) throw new Error('Assignment is already ended')
    a.endDate = new Date()
    await a.save()
    return a
  },

  /**
   * Bulk import from CSV/Excel.
   *
   * Expected columns (case-insensitive, flexible header names):
   *   pastor_name  / name / pastor
   *   church_code  / church / entity_code
   *   role         / position (defaults to 'head-pastor' if blank)
   *   start_date   / from / started
   *   end_date     / to / ended (blank = currently serving)
   *   notes        (optional)
   *
   * Returns { imported, skipped, errors }
   */
  async importCsv({ csvBuffer, conferenceCode, uploadedBy }) {
    const rows = csvParse(csvBuffer, {
      columns:          true,
      skip_empty_lines: true,
      trim:             true,
      bom:              true,
    })

    const results = { imported: 0, skipped: 0, errors: [] }
    const ROLE_VALID = new Set(['head-pastor','associate-pastor','bible-worker','chaplain','elder','district-leader'])

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        // Flexible column name mapping
        const personName  = row.pastor_name || row.name || row.pastor || row.Person
        const churchCode  = row.church_code || row.church || row.entity_code || row.Church
        const rawRole     = row.role || row.position || row.Role || 'head-pastor'
        const startRaw    = row.start_date || row.from || row.started || row.Start
        const endRaw      = row.end_date   || row.to   || row.ended   || row.End || ''
        const notes       = row.notes || row.Notes || null

        if (!personName || !churchCode || !startRaw) {
          results.errors.push({ row: i + 2, reason: 'Missing required field (name, church, or start_date)' })
          results.skipped++
          continue
        }

        // Normalise role
        const role = rawRole.toLowerCase().replace(/\s+/g, '-').replace('pastor-head', 'head-pastor')
        const validRole = ROLE_VALID.has(role) ? role : 'head-pastor'

        const startDate = new Date(startRaw)
        if (isNaN(startDate)) {
          results.errors.push({ row: i + 2, reason: `Invalid start_date: ${startRaw}` })
          results.skipped++
          continue
        }

        const endDate = endRaw ? new Date(endRaw) : null
        if (endRaw && isNaN(endDate)) {
          results.errors.push({ row: i + 2, reason: `Invalid end_date: ${endRaw}` })
          results.skipped++
          continue
        }

        // Skip obvious duplicates (same person, same church, same start date)
        const exists = await PersonnelAssignment.findOne({
          personName: { $regex: new RegExp(`^${personName.trim()}$`, 'i') },
          churchCode:  churchCode.toUpperCase(),
          startDate:  { $gte: new Date(startDate.getTime() - 86400000), $lte: new Date(startDate.getTime() + 86400000) },
        })
        if (exists) { results.skipped++; continue }

        const matchedUser = await User.findOne({
          name: { $regex: new RegExp(`^${personName.trim()}$`, 'i') },
        }).select('_id').lean()

        await PersonnelAssignment.create({
          userId:         matchedUser?._id ?? null,
          personName:     personName.trim(),
          churchCode:     churchCode.toUpperCase(),
          role:           validRole,
          startDate,
          endDate,
          conferenceCode: conferenceCode.toUpperCase(),
          source:         'csv-import',
          uploadedBy,
          notes,
        })
        results.imported++

      } catch (err) {
        results.errors.push({ row: i + 2, reason: err.message })
        results.skipped++
      }
    }

    logger.info('CSV import complete', { conferenceCode, ...results })
    return results
  },

  /**
   * Delegate church-level access to an elder.
   * Called by a pastor; the elder gets delegatedAccess on their User doc.
   */
  async delegateToElder({ pastorId, elderEmail, churchCode, expiresAt }) {
    const pastor = await User.findById(pastorId)
    if (!pastor || pastor.role !== 'pastor') throw new Error('Only pastors can delegate access')
    if (!pastor.assignedChurches.includes(churchCode.toUpperCase())) {
      throw new Error(`You are not assigned to church ${churchCode}`)
    }

    const elder = await User.findOne({ email: elderEmail.toLowerCase() })
    if (!elder) throw new Error(`No user found with email ${elderEmail}`)

    // Check not already delegated
    const alreadyDelegated = elder.delegatedAccess.some(d => d.churchCode === churchCode.toUpperCase())
    if (alreadyDelegated) throw new Error('This elder already has access to that church')

    // Promote to elder role if they're just a member
    if (elder.role === 'member') elder.role = 'elder'

    elder.delegatedAccess.push({
      churchCode:  churchCode.toUpperCase(),
      delegatedBy: pastorId,
      grantedAt:   new Date(),
      expiresAt:   expiresAt ? new Date(expiresAt) : null,
    })
    await elder.save()

    return { elderId: elder._id, elderName: elder.name, churchCode }
  },

  /**
   * Revoke an elder's church access.
   * Can be called by the delegating pastor OR a conference admin.
   */
  async revokeDelegation({ elderId, churchCode, revokedBy }) {
    const elder = await User.findById(elderId)
    if (!elder) throw new Error('User not found')

    const before = elder.delegatedAccess.length
    elder.delegatedAccess = elder.delegatedAccess.filter(
      d => d.churchCode !== churchCode.toUpperCase()
    )

    // If no delegations remain, revert to member
    if (elder.delegatedAccess.length === 0 && elder.role === 'elder') {
      elder.role = 'member'
    }

    if (elder.delegatedAccess.length === before) throw new Error('Delegation not found')
    await elder.save()

    logger.info('Delegation revoked', { elderId, churchCode, revokedBy })
    return { success: true }
  },
}
