/**
 * Tests for personnel.service.js — church validation (refactored in PR #16)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Chainable + thenable mock factory ────────────────────────────────────────
// Supports both:
//   await Model.findOne(...)              (no .lean() — importCsv duplicate check)
//   await Model.findOne(...).lean()       (with chaining — createAssignment)
//   await Model.find(...).select().lean() (chained — importCsv user lookup)
const chain = (resolveWith) => {
  const p = Promise.resolve(resolveWith)
  const q = {
    lean:   vi.fn().mockResolvedValue(resolveWith),
    select: vi.fn().mockReturnThis(),
    sort:   vi.fn().mockReturnThis(),
    then:   (res, rej) => p.then(res, rej),
    catch:  (rej) => p.catch(rej),
    finally:(fn)  => p.finally(fn),
  }
  return q
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockAssertChurch   = vi.fn()
const mockGetChurchCodes = vi.fn()

vi.mock('../src/lib/church.js', () => ({
  assertChurchInConference:    (...a) => mockAssertChurch(...a),
  getChurchCodesForConference: (...a) => mockGetChurchCodes(...a),
}))

const mockUserFindOne = vi.fn()
const mockUserFind    = vi.fn()

vi.mock('../src/models/OrgUnit.js', () => ({ OrgUnit: { find: vi.fn(), findOne: vi.fn() } }))
vi.mock('../src/models/User.js', () => ({
  User: {
    findOne: (...a) => mockUserFindOne(...a),
    find:    (...a) => mockUserFind(...a),
    findById: vi.fn(),
    exists:  vi.fn(),
  },
}))

const mockPAFindOne = vi.fn()
const mockPACreate  = vi.fn()
const mockPAFind    = vi.fn()

vi.mock('../src/models/PersonnelAssignment.js', () => ({
  PersonnelAssignment: {
    find:    (...a) => mockPAFind(...a),
    findOne: (...a) => mockPAFindOne(...a),
    create:  (...a) => mockPACreate(...a),
  },
}))

vi.mock('../src/core/logger.js', () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

const { personnelService } = await import('../src/services/personnel.service.js')

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('personnelService.createAssignment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls assertChurchInConference from lib/church.js', async () => {
    mockAssertChurch.mockResolvedValue(undefined)
    mockUserFindOne.mockReturnValue(chain(null))   // no matched user
    mockPACreate.mockResolvedValue({ _id: 'asgn1' })

    await personnelService.createAssignment({
      personName: 'John Smith', churchCode: 'CHU001', role: 'head-pastor',
      startDate: '2024-01-01', conferenceCode: 'SNSW', uploadedBy: 'adminId',
    })

    expect(mockAssertChurch).toHaveBeenCalledWith('CHU001', 'SNSW')
  })

  it('propagates error from assertChurchInConference', async () => {
    mockAssertChurch.mockRejectedValue(new Error('Church CHU999 does not belong to conference SNSW'))

    await expect(
      personnelService.createAssignment({
        personName: 'John Smith', churchCode: 'CHU999', role: 'head-pastor',
        startDate: '2024-01-01', conferenceCode: 'SNSW', uploadedBy: 'adminId',
      })
    ).rejects.toThrow('CHU999')
  })
})

describe('personnelService.importCsv — church code validation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls getChurchCodesForConference to batch-validate church codes', async () => {
    mockGetChurchCodes.mockResolvedValue(new Set(['CHU001']))
    mockUserFind.mockReturnValue(chain([]))     // no user name matches
    mockPAFindOne.mockReturnValue(chain(null))  // no duplicate check hit
    mockPACreate.mockResolvedValue({})

    const csv = Buffer.from(
      'pastor_name,church_code,role,start_date\nJohn Smith,CHU001,head-pastor,2024-01-01'
    )

    const result = await personnelService.importCsv({
      csvBuffer: csv, conferenceCode: 'SNSW', uploadedBy: 'adminId',
    })

    expect(mockGetChurchCodes).toHaveBeenCalledWith('SNSW')
    expect(result.imported).toBe(1)
    expect(result.errors).toHaveLength(0)
  })

  it('skips rows where church is not in the conference', async () => {
    mockGetChurchCodes.mockResolvedValue(new Set(['CHU001']))
    mockUserFind.mockReturnValue(chain([]))

    const csv = Buffer.from(
      'pastor_name,church_code,role,start_date\nJohn Smith,GHOST,head-pastor,2024-01-01'
    )

    const result = await personnelService.importCsv({
      csvBuffer: csv, conferenceCode: 'SNSW', uploadedBy: 'adminId',
    })

    expect(result.imported).toBe(0)
    expect(result.skipped).toBe(1)
    expect(result.errors[0].reason).toContain('GHOST')
  })

  it('accepts churches nested under intermediate tiers (codes in Set from lib)', async () => {
    mockGetChurchCodes.mockResolvedValue(new Set(['CHU001', 'NESTED']))
    mockUserFind.mockReturnValue(chain([]))
    mockPAFindOne.mockReturnValue(chain(null))
    mockPACreate.mockResolvedValue({})

    const csv = Buffer.from(
      'pastor_name,church_code,role,start_date\nJane Doe,NESTED,head-pastor,2024-01-01'
    )

    const result = await personnelService.importCsv({
      csvBuffer: csv, conferenceCode: 'SNSW', uploadedBy: 'adminId',
    })

    expect(result.imported).toBe(1)
    expect(result.errors).toHaveLength(0)
  })
})
