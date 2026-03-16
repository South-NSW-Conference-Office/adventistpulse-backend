/**
 * pulse.service.js — comprehensive tests
 *
 * Covers:
 *  - getScore returns expected shape { score, grade, breakdown, year, entityCode }
 *  - score range 0–100, grade in A/B/C/D/F
 *  - breakdown has expected categories
 *  - caching behavior
 *  - uses most recent year when year not provided
 *  - NotFoundError for unknown code
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('../src/repositories/entity.repository.js', () => ({
  entityRepository: {
    findByCodeOrFail: vi.fn(),
    find:             vi.fn(),
  },
}))

vi.mock('../src/repositories/stats.repository.js', () => ({
  statsRepository: {
    findByEntityCode:      vi.fn(),
    findLatestForEntity:   vi.fn(),
    findLatestForEntities: vi.fn(),
  },
}))

// ── Imports ──────────────────────────────────────────────────────────────────
import { pulseService } from '../src/services/pulse.service.js'
import { entityRepository } from '../src/repositories/entity.repository.js'
import { statsRepository } from '../src/repositories/stats.repository.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEntity(overrides = {}) {
  return { _id: 'e1', code: 'TEST', name: 'Test Entity', level: 'conference', ...overrides }
}

function makeStat(overrides = {}) {
  return {
    year: 2023,
    entityCode: 'TEST',
    churches: 50,
    membership: {
      beginning: 1000,
      ending: 1050,
      baptisms: 40,
      professionOfFaith: 10,
      transfersIn: 30,
      deaths: 10,
      dropped: 10,
      missing: 5,
      transfersOut: 5,
      growthRate: 0.05,
      retentionRate: 98.5,
      dropoutRate: 1.5,
      accessionRate: 5.0,
      totalAccessions: 50,
      ...overrides.membership,
    },
    workers: { totalWorkers: 20, ...overrides.workers },
    finance: { tithe: 500000, ...overrides.finance },
    derived: {
      membersPerWorker: 52.5,
      tithePerCapita: 476.19,
      ...overrides.derived,
    },
    ...overrides,
  }
}

const EXPECTED_CATEGORIES = [
  'Kingdom Growth',
  'Mission Engagement',
  'Community Connection',
  'Financial Stewardship',
  'Organizational Health',
  'Leadership Effectiveness',
  'Worship Vitality',
  'Future Readiness',
]

// ── getScore ────────────────────────────────────────────────────────────────

describe('pulseService.getScore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear internal cache between tests
    pulseService['#cache']?.clear?.() // private — may not be accessible
  })

  it('returns { score, grade, breakdown, year, entityCode }', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findLatestForEntity.mockResolvedValue(makeStat())
    statsRepository.findByEntityCode.mockResolvedValue([]) // prev year

    const result = await pulseService.getScore('TEST')
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('grade')
    expect(result).toHaveProperty('breakdown')
    expect(result).toHaveProperty('year', 2023)
    expect(result).toHaveProperty('entityCode', 'TEST')
  })

  it('score is between 0 and 100', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findLatestForEntity.mockResolvedValue(makeStat())
    statsRepository.findByEntityCode.mockResolvedValue([])

    const result = await pulseService.getScore('TEST')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('grade is one of A/B/C/D/F or —', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findLatestForEntity.mockResolvedValue(makeStat())
    statsRepository.findByEntityCode.mockResolvedValue([])

    const result = await pulseService.getScore('TEST')
    expect(['A', 'B', 'C', 'D', 'F', '—']).toContain(result.grade)
  })

  it('breakdown has all expected categories', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findLatestForEntity.mockResolvedValue(makeStat())
    statsRepository.findByEntityCode.mockResolvedValue([])

    const result = await pulseService.getScore('TEST')
    const categories = result.breakdown.map(b => b.category)
    for (const cat of EXPECTED_CATEGORIES) {
      expect(categories).toContain(cat)
    }
  })

  it('caches result — second call does not re-fetch prev year from DB', async () => {
    // Use a unique code so prior tests' cache entries don't interfere
    const code = 'CACHE_TEST_' + Date.now()
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity({ code }))
    statsRepository.findLatestForEntity.mockResolvedValue(makeStat({ year: 2023, entityCode: code }))
    statsRepository.findByEntityCode.mockResolvedValue([]) // prev year lookup

    // First call — computes and caches
    await pulseService.getScore(code)
    const prevYearCallsAfterFirst = statsRepository.findByEntityCode.mock.calls.length

    // Second call — should hit cache, skipping prev year lookup
    await pulseService.getScore(code)
    const prevYearCallsAfterSecond = statsRepository.findByEntityCode.mock.calls.length

    // findByEntityCode (prev year) should NOT be called again
    expect(prevYearCallsAfterSecond).toBe(prevYearCallsAfterFirst)
  })

  it('uses most recent year when year not provided', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findLatestForEntity.mockResolvedValue(makeStat({ year: 2022 }))
    statsRepository.findByEntityCode.mockResolvedValue([])

    const result = await pulseService.getScore('TEST')
    expect(result.year).toBe(2022)
    expect(statsRepository.findLatestForEntity).toHaveBeenCalledWith('TEST')
  })

  it('uses specific year when year is provided', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode
      .mockResolvedValueOnce([makeStat({ year: 2021 })]) // requested year
      .mockResolvedValueOnce([]) // prev year
    statsRepository.findLatestForEntity.mockResolvedValue(null)

    const result = await pulseService.getScore('TEST', 2021)
    expect(result.year).toBe(2021)
    expect(statsRepository.findByEntityCode).toHaveBeenCalledWith('TEST', { from: 2021, to: 2021 })
  })

  it('throws NotFoundError for unknown code', async () => {
    const { NotFoundError } = await import('../src/core/errors/index.js')
    entityRepository.findByCodeOrFail.mockRejectedValue(new NotFoundError("Entity 'UNKNOWN'"))

    await expect(pulseService.getScore('UNKNOWN')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('returns score 0 and grade "—" when no stat data exists', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findLatestForEntity.mockResolvedValue(null)

    const result = await pulseService.getScore('TEST')
    expect(result.score).toBe(0)
    expect(result.grade).toBe('—')
  })
})
