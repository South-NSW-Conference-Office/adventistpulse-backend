/**
 * Tests for src/lib/church.js
 *
 * Covers:
 *   - getChurchesForConference: direct, nested via intermediates, hidden exclusion, projection
 *   - assertChurchInConference: pass, fail, nested church
 *   - getChurchCodesForConference: returns Set of uppercase codes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock OrgUnit ──────────────────────────────────────────────────────────────

const mockFind = vi.fn()

vi.mock('../src/models/OrgUnit.js', () => ({
  OrgUnit: {
    find: (...args) => mockFind(...args),
  },
}))

// ── Import after mocks ────────────────────────────────────────────────────────

const {
  getChurchesForConference,
  assertChurchInConference,
  getChurchCodesForConference,
} = await import('../src/lib/church.js')

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a chainable Mongoose-like query object that resolves to `docs` */
function makeQuery(docs) {
  const q = {
    select: vi.fn().mockReturnThis(),
    lean:   vi.fn().mockResolvedValue(docs),
  }
  return q
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('getChurchesForConference', () => {
  beforeEach(() => {
    mockFind.mockReset()
  })

  it('returns direct churches when no intermediates exist', async () => {
    const directChurches = [
      { code: 'CHU001', parentCode: 'SNSW', level: 'church' },
      { code: 'CHU002', parentCode: 'SNSW', level: 'church' },
    ]

    mockFind
      // Step 1: direct churches query
      .mockReturnValueOnce(makeQuery(directChurches))
      // Step 2: intermediates query
      .mockReturnValueOnce(makeQuery([]))

    const result = await getChurchesForConference('SNSW')

    expect(result).toHaveLength(2)
    expect(result.map(c => c.code)).toEqual(['CHU001', 'CHU002'])
  })

  it('includes churches nested under intermediate tiers', async () => {
    const directChurches  = [{ code: 'CHU001', parentCode: 'SNSW', level: 'church' }]
    const intermediates   = [{ code: 'DIST01' }]
    const nestedChurches  = [{ code: 'CHU002', parentCode: 'DIST01', level: 'church' }]

    mockFind
      .mockReturnValueOnce(makeQuery(directChurches))   // Step 1: direct
      .mockReturnValueOnce(makeQuery(intermediates))    // Step 2: intermediates
      .mockReturnValueOnce(makeQuery(nestedChurches))   // Step 3: nested

    const result = await getChurchesForConference('SNSW')

    expect(result).toHaveLength(2)
    expect(result.map(c => c.code)).toEqual(['CHU001', 'CHU002'])
  })

  it('uppercases the conference code before querying', async () => {
    mockFind
      .mockReturnValueOnce(makeQuery([]))
      .mockReturnValueOnce(makeQuery([]))

    await getChurchesForConference('snsw')

    const [firstCall] = mockFind.mock.calls
    expect(firstCall[0].parentCode).toBe('SNSW')
  })

  it('applies projection to direct and nested queries', async () => {
    const directChurches = [{ code: 'CHU001' }]
    const intermediates  = [{ code: 'DIST01' }]
    const nestedChurches = [{ code: 'CHU002' }]

    const directQuery = makeQuery(directChurches)
    const interQuery  = makeQuery(intermediates)
    const nestedQuery = makeQuery(nestedChurches)

    mockFind
      .mockReturnValueOnce(directQuery)
      .mockReturnValueOnce(interQuery)
      .mockReturnValueOnce(nestedQuery)

    await getChurchesForConference('SNSW', { code: 1 })

    expect(directQuery.select).toHaveBeenCalledWith({ code: 1 })
    expect(nestedQuery.select).toHaveBeenCalledWith({ code: 1 })
    // Intermediates always use their own hardcoded projection, not the caller's
    expect(interQuery.select).not.toHaveBeenCalled()
  })

  it('returns empty array when conference has no churches and no intermediates', async () => {
    mockFind
      .mockReturnValueOnce(makeQuery([]))
      .mockReturnValueOnce(makeQuery([]))

    const result = await getChurchesForConference('EMPTY')
    expect(result).toEqual([])
  })

  it('does not make a third DB query when no intermediates found', async () => {
    mockFind
      .mockReturnValueOnce(makeQuery([]))
      .mockReturnValueOnce(makeQuery([]))

    await getChurchesForConference('SNSW')
    expect(mockFind).toHaveBeenCalledTimes(2)
  })
})

describe('assertChurchInConference', () => {
  beforeEach(() => {
    mockFind.mockReset()
  })

  it('resolves without throwing when church is in conference', async () => {
    mockFind
      .mockReturnValueOnce(makeQuery([{ code: 'CHU001', parentCode: 'SNSW' }]))
      .mockReturnValueOnce(makeQuery([]))

    await expect(assertChurchInConference('CHU001', 'SNSW')).resolves.toBeUndefined()
  })

  it('throws when church is not in conference', async () => {
    // Conference SNSW has no churches at all
    mockFind
      .mockReturnValueOnce(makeQuery([]))
      .mockReturnValueOnce(makeQuery([]))

    await expect(assertChurchInConference('CHU999', 'SNSW'))
      .rejects.toThrow('Church CHU999 does not belong to conference SNSW')
  })

  it('resolves for a church nested under an intermediate tier', async () => {
    const intermediates  = [{ code: 'DIST01' }]
    const nestedChurches = [{ code: 'NESTED', parentCode: 'DIST01' }]

    mockFind
      .mockReturnValueOnce(makeQuery([]))           // no direct churches
      .mockReturnValueOnce(makeQuery(intermediates))
      .mockReturnValueOnce(makeQuery(nestedChurches))

    await expect(assertChurchInConference('NESTED', 'SNSW')).resolves.toBeUndefined()
  })

  it('is case-insensitive for churchCode', async () => {
    mockFind
      .mockReturnValueOnce(makeQuery([{ code: 'CHU001', parentCode: 'SNSW' }]))
      .mockReturnValueOnce(makeQuery([]))

    await expect(assertChurchInConference('chu001', 'SNSW')).resolves.toBeUndefined()
  })
})

describe('getChurchCodesForConference', () => {
  beforeEach(() => {
    mockFind.mockReset()
  })

  it('returns a Set of uppercase church codes', async () => {
    mockFind
      .mockReturnValueOnce(makeQuery([{ code: 'CHU001' }, { code: 'CHU002' }]))
      .mockReturnValueOnce(makeQuery([]))

    const result = await getChurchCodesForConference('SNSW')

    expect(result).toBeInstanceOf(Set)
    expect(result.has('CHU001')).toBe(true)
    expect(result.has('CHU002')).toBe(true)
    expect(result.size).toBe(2)
  })

  it('returns an empty Set for a conference with no churches', async () => {
    mockFind
      .mockReturnValueOnce(makeQuery([]))
      .mockReturnValueOnce(makeQuery([]))

    const result = await getChurchCodesForConference('EMPTY')
    expect(result.size).toBe(0)
  })
})
