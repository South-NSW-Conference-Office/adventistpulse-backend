import { BaseRepository } from './base.repository.js'
import { Session }              from '../models/Session.js'
import { ConstitutionDocument } from '../models/ConstitutionDocument.js'
import { SessionBooklet }       from '../models/SessionBooklet.js'

// ─── Session Repository ───────────────────────────────────────────────────────

class SessionRepository extends BaseRepository {
  constructor() {
    super(Session)
  }

  /** All sessions for an entity, newest first */
  async findByEntityCode(entityCode) {
    return this.find({ entityCode: entityCode.toUpperCase() }, { sort: { dateHeld: -1 }, limit: 100 })
  }

  /**
   * Latest confirmed (or estimated) session + next-cycle info.
   * Sorts confirmed sessions (dateHeld set) first, then falls back to
   * most recently created record — handles future/estimated sessions
   * where dateHeld is null.
   */
  async findLatest(entityCode) {
    // First try: latest session with a confirmed date
    const confirmed = await this.model
      .findOne({ entityCode: entityCode.toUpperCase(), dateHeld: { $ne: null } })
      .sort({ dateHeld: -1 })
      .lean()

    if (confirmed) return confirmed

    // Fallback: most recently created record (e.g. estimate-only future session)
    return this.model
      .findOne({ entityCode: entityCode.toUpperCase() })
      .sort({ createdAt: -1 })
      .lean()
  }

  /**
   * Update a session by id, scoped to entityCode to prevent cross-entity mutation.
   * Returns null if no matching document found.
   */
  async updateByIdAndEntityCode(id, entityCode, data) {
    return this.model
      .findOneAndUpdate(
        { _id: id, entityCode: entityCode.toUpperCase() },
        data,
        { new: true, runValidators: true },
      )
      .lean()
  }
}

// ─── ConstitutionDocument Repository ─────────────────────────────────────────

class ConstitutionDocumentRepository extends BaseRepository {
  constructor() {
    super(ConstitutionDocument)
  }

  /** Most recent constitution document for an entity (by effectiveDate, then createdAt) */
  async findByEntityCode(entityCode) {
    return this.model
      .findOne({ entityCode: entityCode.toUpperCase() })
      .sort({ effectiveDate: -1, createdAt: -1 })
      .lean()
  }
}

// ─── SessionBooklet Repository ────────────────────────────────────────────────

class SessionBookletRepository extends BaseRepository {
  constructor() {
    super(SessionBooklet)
  }

  /** Approved booklets for an entity */
  async findApprovedByEntityCode(entityCode) {
    return this.find(
      { entityCode: entityCode.toUpperCase(), status: 'approved' },
      { sort: { createdAt: -1 }, limit: 50 },
    )
  }

  /**
   * Update a booklet by id, scoped to entityCode to prevent cross-entity mutation.
   * Returns null if no matching document found.
   */
  async updateByIdAndEntityCode(id, entityCode, data) {
    return this.model
      .findOneAndUpdate(
        { _id: id, entityCode: entityCode.toUpperCase() },
        data,
        { new: true, runValidators: true },
      )
      .lean()
  }
}

// ─── Singleton exports ────────────────────────────────────────────────────────

export const sessionRepository              = new SessionRepository()
export const constitutionDocumentRepository = new ConstitutionDocumentRepository()
export const sessionBookletRepository       = new SessionBookletRepository()
