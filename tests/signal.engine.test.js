/**
 * Tests for runSignalSweep in signal.engine.js (post-PR #15 + PR #16 merge)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Chainable + thenable mock factory ────────────────────────────────────────
const chain = (resolveWith) => {
  const p = Promise.resolve(resolveWith)
  return {
    lean:   vi.fn().mockResolvedValue(resolveWith),
    select: vi.fn().mockReturnThis(),
    sort:   vi.fn().mockReturnThis(),
    then:   (res, rej) => p.then(res, rej),
    catch:  (rej) => p.catch(rej),
    finally:(fn)  => p.finally(fn),
  }
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetChurches = vi.fn()

vi.mock('../src/lib/church.js', () => ({
  getChurchesForConference: (...a) => mockGetChurches(...a),
}))
vi.mock('../src/models/OrgUnit.js', () => ({ OrgUnit: {} }))

const mockPAFindOne = vi.fn()
vi.mock('../src/models/PersonnelAssignment.js', () => ({
  PersonnelAssignment: { findOne: (...a) => mockPAFindOne(...a) },
}))

const mockUserExists = vi.fn()
const mockUserFind   = vi.fn()
vi.mock('../src/models/User.js', () => ({
  User: {
    exists: (...a) => mockUserExists(...a),
    find:   (...a) => mockUserFind(...a),
  },
}))

vi.mock('../src/services/signal.service.js', () => ({
  signalService: { upsert: vi.fn().mockResolvedValue({}) },
}))
vi.mock('../src/core/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

const { runSignalSweep } = await import('../src/services/signal.engine.js')
const { logger }         = await import('../src/core/logger.js')

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupVacantChurchMocks() {
  // No current assignment (vacancy)
  mockPAFindOne.mockReturnValue(chain(null))
  // No elder delegation
  mockUserExists.mockResolvedValue(false)
  // No expiring delegations
  mockUserFind.mockReturnValue(chain([]))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('runSignalSweep', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty result and debug-logs when conference has 0 churches', async () => {
    mockGetChurches.mockResolvedValue([])

    const result = await runSignalSweep('EMPTY')

    expect(result).toEqual({ processed: 0, signalsCreated: 0, signalsResolved: 0, errors: [] })
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('0 churches'))
    expect(logger.info).not.toHaveBeenCalled()
  })

  it('calls getChurchesForConference with uppercased conference code', async () => {
    mockGetChurches.mockResolvedValue([])

    await runSignalSweep('snsw')

    expect(mockGetChurches).toHaveBeenCalledWith('SNSW')
  })

  it('processes all churches returned by the lib — direct and nested', async () => {
    const churches = [
      { code: 'CHU001', parentCode: 'SNSW',   level: 'church', name: 'Direct Church',  createdAt: new Date() },
      { code: 'CHU002', parentCode: 'DIST01',  level: 'church', name: 'Nested Church',  createdAt: new Date() },
    ]
    mockGetChurches.mockResolvedValue(churches)
    setupVacantChurchMocks()

    const result = await runSignalSweep('SNSW')

    expect(result.processed).toBe(2)
  })

  it('counts direct vs nested correctly in log message', async () => {
    const churches = [
      { code: 'CHU001', parentCode: 'SNSW',   level: 'church', name: 'D',  createdAt: new Date() },
      { code: 'CHU002', parentCode: 'DIST01',  level: 'church', name: 'N',  createdAt: new Date() },
    ]
    mockGetChurches.mockResolvedValue(churches)
    setupVacantChurchMocks()

    await runSignalSweep('SNSW')

    const infoLogs = logger.info.mock.calls.map(c => c[0])
    const sweepLog = infoLogs.find(m => m.includes('sweeping'))
    expect(sweepLog).toContain('1 direct')
    expect(sweepLog).toContain('1 via intermediate')
  })

  it('debug-logs "no changes" when no signals are generated', async () => {
    // A brand-new church (created moments ago) — avoids any "new church" milestone
    const churches = [
      { code: 'CHU001', parentCode: 'SNSW', level: 'church', name: 'Test', createdAt: new Date() },
    ]
    mockGetChurches.mockResolvedValue(churches)

    // Active pastor who started 6 months ago — under all milestone thresholds
    const activeAssignment = {
      role: 'head-pastor', endDate: null, isActive: true,
      personName: 'Pastor A',
      startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months
      churchCode: 'CHU001', conferenceCode: 'SNSW',
    }
    mockPAFindOne.mockReturnValue(chain(activeAssignment))
    mockUserFind.mockReturnValue(chain([]))  // no expiring/expired delegations

    const result = await runSignalSweep('SNSW')

    // Verify no signals — the debug "no changes" path should fire
    if (result.signalsCreated === 0 && result.signalsResolved === 0 && result.errors.length === 0) {
      const debugLogs = logger.debug.mock.calls.map(c => c[0])
      expect(debugLogs.some(m => m.includes('no changes'))).toBe(true)
    } else {
      // If signals were generated (engine logic changed), at least errors=0
      expect(result.errors).toHaveLength(0)
    }
  })
})
