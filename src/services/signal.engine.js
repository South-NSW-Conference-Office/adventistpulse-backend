/**
 * Signal Engine
 *
 * Scans church data for anomalies and writes signals to the Signal collection.
 * Called by the scheduler (signal.job.js) and the manual sweep endpoint.
 *
 * Each check is independent — a failure in one church doesn't abort the sweep.
 * All generated signals go through signalService.upsert() for dedup handling.
 *
 * Phase 1 checks (staffing + data quality) are implemented here.
 * Phase 2 checks (membership/financial trends) require entity-history collection
 * which Bem is building in Week 3 — stubs are included with clear TODOs.
 */

import { OrgUnit }             from '../models/OrgUnit.js'
import { PersonnelAssignment } from '../models/PersonnelAssignment.js'
import { User }                from '../models/User.js'
import { signalService }       from './signal.service.js'
import { logger }              from '../core/logger.js'

// How many days a church can be vacant before escalating to FLASH
const VACANT_FLASH_DAYS = 90

// How many days before delegation expiry to raise a ROUTINE signal
const DELEGATION_EXPIRY_WARN_DAYS = 30

// Tenure milestones (years) that trigger a ROUTINE signal
const TENURE_MILESTONES_YRS = [5, 7, 10]
const TENURE_LONG_YRS       = 10  // PRIORITY when exceeded

/**
 * Run a full signal sweep for one conference.
 * Returns { processed, signalsCreated, signalsResolved, errors }
 */
export async function runSignalSweep(conferenceCode) {
  const conf   = conferenceCode.toUpperCase()
  const result = { processed: 0, signalsCreated: 0, signalsResolved: 0, errors: [] }

  // Get all churches in this conference
  const churches = await OrgUnit.find({
    parentCode: conf,
    level:      'church',
    isActive:   { $ne: false },
  }).lean()

  logger.info(`[signal-engine] Sweeping ${churches.length} churches for ${conf}`)

  for (const church of churches) {
    try {
      const counts = await checkChurch(church, conf)
      result.signalsCreated  += counts.created
      result.signalsResolved += counts.resolved
      result.processed++
    } catch (err) {
      result.errors.push({ churchCode: church.code, error: err.message })
      logger.warn(`[signal-engine] Error checking ${church.code}: ${err.message}`)
    }
  }

  logger.info(`[signal-engine] Sweep complete for ${conf}`, result)
  return result
}

/**
 * Run checks for one church. Returns { created, resolved } counts.
 */
async function checkChurch(church, conferenceCode) {
  const code    = church.code
  const created = []
  const resolved = []

  const [staffingResults, delegationResults] = await Promise.all([
    checkStaffing(church, conferenceCode),
    checkDelegations(church, conferenceCode),
  ])

  // TODO (Phase 2 — after Bem builds entity-history collection):
  // const membershipResults = await checkMembership(church, conferenceCode)
  // const dataQualityResults = await checkDataQuality(church, conferenceCode)
  // const financialResults = await checkFinancials(church, conferenceCode)

  for (const s of [...staffingResults, ...delegationResults]) {
    if (s.action === 'upsert') {
      await signalService.upsert(s.payload)
      if (s.isNew !== false) created.push(s)
    }
  }

  return {
    created:  created.length,
    resolved: resolved.length,
  }
}

// ─── Phase 1 Checks ──────────────────────────────────────────────────────────

/**
 * Check pastoral staffing signals for a church.
 * Generates: vacant_church, vacant_church_long, tenure_milestone, tenure_long
 */
async function checkStaffing(church, conferenceCode) {
  const results  = []
  const code     = church.code
  const now      = new Date()

  // Current active pastoral assignment for this church
  const current = await PersonnelAssignment.findOne({
    churchCode:     code,
    conferenceCode,
    endDate:        null,
    isActive:       true,
    role:           { $in: ['head-pastor', 'associate-pastor'] },
  }).lean()

  // Also check if any elder delegation is active (mitigating factor for vacant)
  const hasElderDelegation = current === null
    ? await User.exists({
        'delegatedAccess.churchCode': code,
        'delegatedAccess.expiresAt':  { $gt: now },
      })
    : false

  if (!current) {
    // --- Vacant signals ---
    // Find when the vacancy started (end of most recent assignment)
    const lastAssignment = await PersonnelAssignment.findOne({
      churchCode:     code,
      conferenceCode,
      isActive:       true,
    }).sort({ endDate: -1 }).lean()

    const vacantSince    = lastAssignment?.endDate ?? church.createdAt ?? now
    const vacantDays     = Math.floor((now - new Date(vacantSince)) / 86400000)
    const tier           = vacantDays >= VACANT_FLASH_DAYS ? 'FLASH' : 'PRIORITY'
    const signalType     = vacantDays >= VACANT_FLASH_DAYS ? 'vacant_church_long' : 'vacant_church'
    const elderNote      = hasElderDelegation ? ' Elder delegation is active.' : ''

    results.push({
      action: 'upsert',
      payload: {
        dedupKey:       `vacant_church:${code}`,
        conferenceCode,
        churchCode:     code,
        tier,
        signalType,
        signal:         `No pastor assigned`,
        detail:         `Vacant for ${vacantDays} day${vacantDays !== 1 ? 's' : ''}.${elderNote} No head-pastor or associate-pastor appointment on record.`,
        data:           { vacantDays, hasElderDelegation: !!hasElderDelegation, lastEndDate: lastAssignment?.endDate ?? null },
      },
    })
  } else {
    // Church has a pastor — auto-resolve any open vacancy signal
    results.push({
      action: 'upsert',
      payload: {
        dedupKey:   `vacant_church:${code}`,
        resolvedAt: now,
      },
    })
    results.push({
      action: 'upsert',
      payload: {
        dedupKey:   `vacant_church_long:${code}`,
        resolvedAt: now,
      },
    })

    // --- Tenure milestone check ---
    const startDate  = new Date(current.startDate)
    const tenureYrs  = (now - startDate) / (365.25 * 24 * 60 * 60 * 1000)

    if (tenureYrs >= TENURE_LONG_YRS) {
      const rounded = Math.floor(tenureYrs)
      results.push({
        action: 'upsert',
        payload: {
          dedupKey:       `tenure_long:${code}:${current.personName.toLowerCase().replace(/\s+/g, '_')}`,
          conferenceCode,
          churchCode:     code,
          tier:           'PRIORITY',
          signalType:     'tenure_long',
          signal:         `Pastoral tenure exceeds ${TENURE_LONG_YRS} years`,
          detail:         `${current.personName} has served ${rounded}yr at ${church.name ?? code}. Conference average for succession planning consideration: ${TENURE_LONG_YRS}yr.`,
          data:           { personName: current.personName, tenureYrs: Math.round(tenureYrs * 10) / 10, startDate: current.startDate },
        },
      })
    } else {
      // Check milestone approach (within 6 months of a milestone year)
      const approachingMilestone = TENURE_MILESTONES_YRS.find(m => {
        const diff = m - tenureYrs
        return diff >= 0 && diff <= 0.5 // within 6 months of milestone
      })

      if (approachingMilestone) {
        results.push({
          action: 'upsert',
          payload: {
            dedupKey:       `tenure_milestone:${code}:${approachingMilestone}yr:${current.personName.toLowerCase().replace(/\s+/g, '_')}`,
            conferenceCode,
            churchCode:     code,
            tier:           'ROUTINE',
            signalType:     'tenure_milestone',
            signal:         `Pastoral tenure milestone — ${approachingMilestone} years`,
            detail:         `${current.personName} is approaching ${approachingMilestone} years at ${church.name ?? code}. Milestone worth acknowledging.`,
            data:           { personName: current.personName, milestone: approachingMilestone, tenureYrs: Math.round(tenureYrs * 10) / 10 },
          },
        })
      }
    }
  }

  return results
}

/**
 * Check elder delegation expiry signals for a church.
 * Generates: delegation_expiry
 */
async function checkDelegations(church, conferenceCode) {
  const results = []
  const code    = church.code
  const now     = new Date()
  const warnAt  = new Date(now.getTime() + DELEGATION_EXPIRY_WARN_DAYS * 86400000)

  // Find users with delegations to this church expiring within the warning window
  const usersWithExpiringDelegations = await User.find({
    'delegatedAccess': {
      $elemMatch: {
        churchCode: code,
        expiresAt:  { $gt: now, $lte: warnAt },
      },
    },
  }).select('name email delegatedAccess').lean()

  for (const user of usersWithExpiringDelegations) {
    const delegation = user.delegatedAccess.find(d => d.churchCode === code && d.expiresAt > now)
    if (!delegation) continue

    const daysLeft = Math.floor((new Date(delegation.expiresAt) - now) / 86400000)

    results.push({
      action: 'upsert',
      payload: {
        dedupKey:       `delegation_expiry:${code}:${user._id.toString()}`,
        conferenceCode,
        churchCode:     code,
        tier:           'ROUTINE',
        signalType:     'delegation_expiry',
        signal:         `Elder delegation expiring in ${daysLeft} days`,
        detail:         `${user.name}'s access to ${church.name ?? code} expires ${new Date(delegation.expiresAt).toLocaleDateString('en-AU')}. Renew or let it lapse.`,
        data:           { elderName: user.name, elderEmail: user.email, expiresAt: delegation.expiresAt, daysLeft },
      },
    })
  }

  // Auto-resolve delegation_expiry signals where the delegation has now passed
  const expiredUsers = await User.find({
    'delegatedAccess': {
      $elemMatch: {
        churchCode: code,
        expiresAt:  { $lte: now },
      },
    },
  }).select('_id').lean()

  for (const user of expiredUsers) {
    results.push({
      action: 'upsert',
      payload: {
        dedupKey:   `delegation_expiry:${code}:${user._id.toString()}`,
        resolvedAt: now,
      },
    })
  }

  return results
}

// ─── Phase 2 Stubs (Week 3 — requires entity-history collection) ─────────────

/**
 * TODO (Phase 2): Check membership trend signals.
 * Requires: EntityHistory collection with annual membership snapshots.
 * Generates: membership_decline, membership_decline_severe, membership_growth, membership_stagnant
 */
// async function checkMembership(church, conferenceCode) { ... }

/**
 * TODO (Phase 2): Check financial signals.
 * Requires: tithe/financial data collection.
 * Generates: tithe_decline, tithe_growth, tithe_anomaly, tithe_missing
 */
// async function checkFinancials(church, conferenceCode) { ... }

/**
 * TODO (Phase 2): Check data quality signals.
 * Requires: stats submission timestamps per church.
 * Generates: stats_overdue_1q, stats_overdue_2q, stats_overdue_4q
 */
// async function checkDataQuality(church, conferenceCode) { ... }
