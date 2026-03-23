import { Institution } from '../models/Institution.js'
import { ACNCEntry } from '../models/ACNCEntry.js'

/**
 * Escape a string for safe use in a MongoDB $regex.
 * Prevents ReDoS from user-supplied input.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export class institutionService {
  /** List institutions with optional filters + pagination */
  static async list({ type, region, country, conferenceCode, q, page = 1, limit = 50 } = {}) {
    const query = { active: true }
    if (type)           query.type = type
    if (region)         query.region = new RegExp(escapeRegex(region), 'i')
    if (country)        query.country = new RegExp(escapeRegex(country), 'i')
    if (conferenceCode) query.conferenceCode = conferenceCode.toUpperCase()
    if (q)              query.$text = { $search: q }

    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      Institution.find(query).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Institution.countDocuments(query),
    ])
    return { data, total, page, limit, pages: Math.ceil(total / limit) }
  }

  /** Get a single institution by code */
  static async getByCode(code) {
    return Institution.findOne({
      code: code.toUpperCase(),
      active: true,
    }).lean()
  }

  /** Get institutions by type */
  static async getByType(type) {
    return Institution.find({ type, active: true }).sort({ name: 1 }).lean()
  }

  /** Create institution (admin only) */
  static async create(data) {
    const institution = new Institution(data)
    await institution.save()
    return institution.toObject()
  }

  /** Update institution (admin only) */
  static async update(code, data) {
    return Institution.findOneAndUpdate(
      { code: code.toUpperCase(), active: true },
      { ...data, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean()
  }

  /** Soft delete */
  static async delete(code) {
    await Institution.findOneAndUpdate(
      { code: code.toUpperCase() },
      { active: false }
    )
  }

  /** Get all ACNC entries, optionally filtered by financial year and/or type */
  static async listACNC({ financialYear, type } = {}) {
    const query = { active: true }
    if (financialYear) query.financialYear = financialYear
    if (type)          query.type = type
    return ACNCEntry.find(query).sort({ totalAssets: -1 }).lean()
  }

  /** Get ACNC entries for a specific institution (most recent first) */
  static async getACNCByInstitution(institutionCode) {
    return ACNCEntry.find({
      institutionCode: institutionCode.toUpperCase(),
      active: true,
    }).sort({ financialYear: -1 }).lean()
  }

  /** Full-text search across name + description + tags */
  static async search(q, limit = 10) {
    return Institution.find(
      { $text: { $search: q }, active: true },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(Number(limit))
    .lean()
  }
}
