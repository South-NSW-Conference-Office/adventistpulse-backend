/**
 * lib/church.js — Shared church-conference query helpers.
 *
 * Single source of truth for any operation that needs to discover or validate
 * churches within a conference. Previously this logic was duplicated across:
 *
 *   - services/signal.engine.js  (2-step query — correct but inline)
 *   - services/personnel.service.js  (single-level only — missed nested churches)
 *   - services/survey.service.js  (single-level only — missed nested churches)
 *
 * Design principles:
 *   SRP  — this module owns church-scoped DB queries only.
 *   DRY  — one implementation, imported everywhere that needs it.
 *   OCP  — add new query helpers here without touching callers.
 *
 * Why two-step discovery matters:
 *   In some conferences, churches sit under an intermediate tier
 *   (district, field, section, field_station) rather than directly under
 *   the conference. A single-level query (parentCode = conferenceCode) misses
 *   those churches, causing silent data gaps and incorrect territory checks.
 *
 * The intermediate-tier exclusion list mirrors the level taxonomy in OrgUnit.js.
 * If new levels are added, update NON_INTERMEDIATE_LEVELS here.
 */

import { OrgUnit } from '../models/OrgUnit.js'

/**
 * Levels that are NOT intermediate tiers (i.e. they are org-structure anchors,
 * not districts/fields through which churches can be nested).
 * Used to identify intermediate tiers by exclusion.
 */
const NON_INTERMEDIATE_LEVELS = new Set([
  'gc', 'division', 'union', 'conference', 'mission', 'church',
])

/**
 * Get all church documents under a conference, including churches nested
 * via intermediate tiers (district, field, section, field_station…).
 *
 * @param {string} conferenceCode - Uppercase conference code (e.g. 'SNSW')
 * @param {object} [projection]   - Optional Mongoose projection (e.g. { code: 1 })
 * @returns {Promise<object[]>}   - Lean church documents
 */
export async function getChurchesForConference(conferenceCode, projection = null) {
  const conf = conferenceCode.toUpperCase()

  // Step 1: churches sitting directly under the conference
  const directQuery = OrgUnit.find(
    { parentCode: conf, level: 'church', hidden: { $ne: true } },
  )
  if (projection) directQuery.select(projection)
  const directChurches = await directQuery.lean()

  // Step 2: churches sitting under intermediate tiers (district, field, etc.)
  const intermediates = await OrgUnit.find(
    {
      parentCode: conf,
      level: { $nin: [...NON_INTERMEDIATE_LEVELS] },
      hidden: { $ne: true },
    },
    { code: 1 },
  ).lean()

  let nestedChurches = []
  if (intermediates.length > 0) {
    const intermediateCodes = intermediates.map(d => d.code)
    const nestedQuery = OrgUnit.find(
      { parentCode: { $in: intermediateCodes }, level: 'church', hidden: { $ne: true } },
    )
    if (projection) nestedQuery.select(projection)
    nestedChurches = await nestedQuery.lean()
  }

  return [...directChurches, ...nestedChurches]
}

/**
 * Assert that a church belongs to a conference.
 * Correctly handles nested hierarchies (church → district → conference).
 *
 * @param {string} churchCode      - Church code to validate
 * @param {string} conferenceCode  - Conference the caller is scoped to
 * @throws {Error}                 - If the church is not in the conference
 */
export async function assertChurchInConference(churchCode, conferenceCode) {
  const codes = await getChurchCodesForConference(conferenceCode)
  if (!codes.has(churchCode.toUpperCase())) {
    throw new Error(`Church ${churchCode} does not belong to conference ${conferenceCode}`)
  }
}

/**
 * Get all church codes under a conference (lightweight — codes only).
 * Useful for building Set-based membership tests without loading full documents.
 *
 * @param {string} conferenceCode
 * @returns {Promise<Set<string>>} - Set of uppercase church codes
 */
export async function getChurchCodesForConference(conferenceCode) {
  const churches = await getChurchesForConference(conferenceCode, { code: 1 })
  return new Set(churches.map(c => c.code))
}
