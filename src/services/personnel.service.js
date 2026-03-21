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
import { OrgUnit } from '../models/OrgUnit.js'
import { User } from '../models/User.js'
import { logger } from '../core/logger.js'

/**
 * Escape a string for safe use in a MongoDB $regex.
 * Prevents ReDoS from user-supplied names.
 */
function escapeRegex(str) {
  return str.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Build a case-insensitive exact-match regex from an escaped name.
 */
function nameRegex(name) {
  return new RegExp(`^${escapeRegex(name)}$`, 'i')
}

/**
 * Assert that a churchCode belongs to the given conferenceCode.
 * Throws if the church is not in the admin's territory.
 */
async function assertChurchInConference(churchCode, conferenceCode) {
  const church = await OrgUnit.findOne({
    code:       churchCode.toUpperCase(),
    parentCode: conferenceCode.toUpperCase(),
    level:      'church',
  }).lean()
  if (!church) {
    throw new Error(`Church ${churchCode} does not belong to conference ${conferenceCode}`)
  }
}

export const personnelService = {

  /**
   * List all current assignments for a conference.
   * conferenceCode is always taken from the calling user's subscription —
   * never trusted from the request.
   */
  async listCurrent(conferenceCode) {
    return PersonnelAssignment.find({
      conferenceCode: conferenceCode.toUpperCase(),
      endDate:  null,
      isActive: true,
    }).sort({ churchCode: 1, startDate: -1 }).lean()
  },

  /**
   * List full assignment history for a church.
   * Scoped to the admin's conference — cannot cross tenant boundaries.
   */
  async churchHistory(churchCode, conferenceCode) {
    // Verify the church is in this admin's territory
    await assertChurchInConference(churchCode, conferenceCode)

    return PersonnelAssignment.find({
      churchCode:     churchCode.toUpperCase(),
      conferenceCode: conferenceCode.toUpperCase(), // belt and braces
      isActive:       true,
    }).sort({ startDate: -1 }).lean()
  },

  /**
   * Create a single assignment (admin UI).
   * conferenceCode is pinned to the calling user's subscription.
   */
  async createAssignment({
    personName, churchCode, role, startDate, endDate,
    conferenceCode, uploadedBy, notes,
  }) {
    // Verify the church belongs to this conference
    await assertChurchInConference(churchCode, conferenceCode)

    // Safe name match — escaped before regex construction (ReDoS fix)
    const matchedUser = await User.findOne({
      name: nameRegex(personName),
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
   * Verifies the assignment belongs to the admin's conference.
   */
  async endAssignment(assignmentId, conferenceCode) {
    const a = await PersonnelAssignment.findOne({
      _id:            assignmentId,
      conferenceCode: conferenceCode.toUpperCase(), // tenant scope
    })
    if (!a) throw new Error('Assignment not found')
    if (a.endDate) throw new Error('Assignment is already ended')
    a.endDate = new Date()
    await a.save()
    return a
  },

  /**
   * Bulk import from CSV.
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

    const results  = { imported: 0, skipped: 0, errors: [] }
    const ROLE_VALID = new Set(['head-pastor','associate-pastor','bible-worker','chaplain','elder','district-leader'])
    const conf = conferenceCode.toUpperCase()

    // Batch-load all churches in this conference to avoid N+1 queries
    const conferenceChurches = await OrgUnit.find({
      parentCode: conf,
      level:      'church',
    }).select('code').lean()
    const validChurchCodes = new Set(conferenceChurches.map(c => c.code))

    // Batch-load all users for name matching
    const allUsers = await User.find().select('_id name').lean()
    const usersByNormalizedName = new Map(
      allUsers.map(u => [u.name?.trim().toLowerCase(), u._id])
    )

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const personName = row.pastor_name || row.name || row.pastor || row.Person
        const churchCode = row.church_code || row.church || row.entity_code || row.Church
        const rawRole    = row.role || row.position || row.Role || 'head-pastor'
        const startRaw   = row.start_date || row.from || row.started || row.Start
        const endRaw     = row.end_date   || row.to   || row.ended   || row.End || ''
        const notes      = row.notes || row.Notes || null

        if (!personName || !churchCode || !startRaw) {
          results.errors.push({ row: i + 2, reason: 'Missing required field (name, church, or start_date)' })
          results.skipped++
          continue
        }

        if (!validChurchCodes.has(churchCode.toUpperCase())) {
          results.errors.push({ row: i + 2, reason: `Church ${churchCode} not in conference ${conf}` })
          results.skipped++
          continue
        }

        const role      = rawRole.toLowerCase().replace(/\s+/g, '-').replace('pastor-head', 'head-pastor')
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

        // Skip duplicates — escaped regex (ReDoS fix)
        const exists = await PersonnelAssignment.findOne({
          personName: nameRegex(personName),
          churchCode: churchCode.toUpperCase(),
          startDate:  {
            $gte: new Date(startDate.getTime() - 86400000),
            $lte: new Date(startDate.getTime() + 86400000),
          },
        })
        if (exists) { results.skipped++; continue }

        const matchedUserId = usersByNormalizedName.get(personName.trim().toLowerCase()) ?? null

        await PersonnelAssignment.create({
          userId:         matchedUserId,
          personName:     personName.trim(),
          churchCode:     churchCode.toUpperCase(),
          role:           validRole,
          startDate,
          endDate,
          conferenceCode: conf,
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

    logger.info('CSV import complete', { conferenceCode: conf, ...results })
    return results
  },

  /**
   * Delegate church-level access to an elder.
   * Pastor must be assigned to the church.
   * Elder must be a member of the same conference territory.
   */
  async delegateToElder({ pastorId, elderEmail, churchCode, expiresAt, conferenceCode }) {
    const pastor = await User.findById(pastorId)
    if (!pastor || pastor.role !== 'pastor') throw new Error('Only pastors can delegate access')

    const upperCode = churchCode.toUpperCase()

    if (!pastor.assignedChurches.includes(upperCode)) {
      throw new Error(`You are not assigned to church ${churchCode}`)
    }

    // Verify the target church is in the pastor's conference (belt and braces)
    await assertChurchInConference(upperCode, conferenceCode)

    const elder = await User.findOne({ email: elderEmail.toLowerCase() })
    if (!elder) throw new Error(`No user found with email ${elderEmail}`)

    // Territory check — elder must be a member of a church in the same conference
    if (elder.memberChurch) {
      const elderChurch = await OrgUnit.findOne({
        code:       elder.memberChurch.toUpperCase(),
        parentCode: conferenceCode.toUpperCase(),
      }).lean()
      if (!elderChurch) {
        throw new Error(`${elder.name} is not a member of a church in your conference`)
      }
    }

    const alreadyDelegated = elder.delegatedAccess.some(d => d.churchCode === upperCode)
    if (alreadyDelegated) throw new Error('This elder already has access to that church')

    if (elder.role === 'member' || elder.role === 'viewer') elder.role = 'elder'

    elder.delegatedAccess.push({
      churchCode:  upperCode,
      delegatedBy: pastorId,
      grantedAt:   new Date(),
      expiresAt:   expiresAt ? new Date(expiresAt) : null,
    })
    await elder.save()

    return { elderId: elder._id, elderName: elder.name, churchCode: upperCode }
  },

  /**
   * Revoke an elder's church access.
   * Caller must be the delegating pastor OR an admin in the same conference.
   */
  async revokeDelegation({ elderId, churchCode, revokedBy, conferenceCode }) {
    const elder = await User.findById(elderId)
    if (!elder) throw new Error('User not found')

    const upperCode = churchCode.toUpperCase()

    // Find the delegation to revoke
    const delegation = elder.delegatedAccess.find(d => d.churchCode === upperCode)
    if (!delegation) throw new Error('Delegation not found')

    // Ownership check: must be the delegating pastor or an admin
    const revoker = await User.findById(revokedBy)
    if (!revoker) throw new Error('Revoking user not found')

    const isPastorWhoGranted = String(delegation.delegatedBy) === String(revokedBy)
    const isAdmin = revoker.role === 'admin' &&
                    revoker.subscription?.conferenceCode === conferenceCode?.toUpperCase()

    if (!isPastorWhoGranted && !isAdmin) {
      throw new Error('You do not have permission to revoke this delegation')
    }

    elder.delegatedAccess = elder.delegatedAccess.filter(d => d.churchCode !== upperCode)

    if (elder.delegatedAccess.length === 0 && elder.role === 'elder') {
      elder.role = 'member'
    }

    await elder.save()

    logger.info('Delegation revoked', { elderId, churchCode: upperCode, revokedBy })
    return { success: true }
  },
}
