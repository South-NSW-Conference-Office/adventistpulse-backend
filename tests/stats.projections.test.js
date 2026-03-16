/**
 * stats.service.js — getProjections() tests
 *
 * Covers:
 *  - Return shape: { cagr, scenarios, extinctionYear, milestones }
 *  - scenarios has current/moderate/revival arrays
 *  - extinctionYear is null when CAGR positive, computed when negative
 *  - milestones only include thresholds above current membership
 *  - NotFoundError for unknown code
 *  - Edge case: only 1 year of data
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('../src/repositories/entity.repository.js', () => ({
  entityRepository: {
    findByCodeOrFail: vi.fn(),
  },
}))

vi.mock('../src/repositories/stats.repository.js', () => ({
  statsRepository: {
    findByEntityCode:      vi.fn(),
    findLatestForEntity:   vi.fn(),
    findLatestForEntities: vi.fn(),
    upsert:                vi.fn(),
    getRankings:           vi.fn(),
    countRankings:         vi.fn(),
    getMapData:            vi.fn(),
    getCountryTrend:       vi.fn(),
    getCountrySummary:     vi.fn(),
    getCountryRankings:    vi.fn(),
  },
}))

// ── Imports ──────────────────────────────────────────────────────────────────
import { statsService } from '../src/services/stats.service.js'
import { entityRepository } from '../src/repositories/entity.repository.js'
import { statsRepository } from '../src/repositories/stats.repository.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEntity(overrides = {}) {
  return { _id: 'e1', code: 'TEST', name: 'Test Entity', level: 'conference', ...overrides }
}

function makeStatYear(year, ending) {
  return {
    year,
    entityCode: 'TEST',
    membership: { ending, beginning: ending - 10 },
  }
}

// Generate 10 years of growing data
function makeGrowingHistory() {
  const stats = []
  for (let i = 0; i < 10; i++) {
    stats.push(makeStatYear(2014 + i, 1000 + i * 50))
  }
  return stats
}

// Generate 10 years of declining data
function makeDecliningHistory() {
  const stats = []
  for (let i = 0; i < 10; i++) {
    stats.push(makeStatYear(2014 + i, 1000 - i * 50))
  }
  return stats
}

// ── getProjections ──────────────────────────────────────────────────────────

describe('statsService.getProjections', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns expected shape with points, extinctionYear, milestones, rates', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue(makeGrowingHistory())

    const result = await statsService.getProjections('TEST')
    expect(result).toHaveProperty('entityCode', 'TEST')
    expect(result).toHaveProperty('entityName', 'Test Entity')
    expect(result).toHaveProperty('points5')
    expect(result).toHaveProperty('points10')
    expect(result).toHaveProperty('points20')
    expect(result).toHaveProperty('extinctionYear')
    expect(result).toHaveProperty('milestones')
    expect(result).toHaveProperty('currentRate')
    expect(result).toHaveProperty('moderateRate')
    expect(result).toHaveProperty('revivalRate')
  })

  it('scenarios points have {year, current, moderate, revival}', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue(makeGrowingHistory())

    const result = await statsService.getProjections('TEST')
    expect(result.points5.length).toBe(5)
    const point = result.points5[0]
    expect(point).toHaveProperty('year')
    expect(point).toHaveProperty('current')
    expect(point).toHaveProperty('moderate')
    expect(point).toHaveProperty('revival')
  })

  it('extinctionYear is null when CAGR is positive', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue(makeGrowingHistory())

    const result = await statsService.getProjections('TEST')
    expect(result.extinctionYear).toBeNull()
    expect(result.currentRate).toBeGreaterThan(0)
  })

  it('extinctionYear is computed when CAGR is negative', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue(makeDecliningHistory())

    const result = await statsService.getProjections('TEST')
    expect(result.currentRate).toBeLessThan(0)
    expect(result.extinctionYear).not.toBeNull()
    expect(result.extinctionYear).toBeGreaterThan(2023)
  })

  it('milestones only include thresholds above current membership (for growth)', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    // Small entity with growth — milestones should be thresholds above current
    const stats = []
    for (let i = 0; i < 10; i++) {
      stats.push(makeStatYear(2014 + i, 500 + i * 50))
    }
    statsRepository.findByEntityCode.mockResolvedValue(stats)

    const result = await statsService.getProjections('TEST')
    const latestMem = 500 + 9 * 50 // 950
    for (const m of result.milestones) {
      expect(m.threshold).toBeGreaterThan(latestMem)
    }
  })

  it('throws NotFoundError for unknown code', async () => {
    const { NotFoundError } = await import('../src/core/errors/index.js')
    entityRepository.findByCodeOrFail.mockRejectedValue(new NotFoundError("Entity 'UNKNOWN'"))

    await expect(statsService.getProjections('UNKNOWN')).rejects.toBeInstanceOf(NotFoundError)
  })

  it('handles edge case: only 1 year of data available', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([makeStatYear(2023, 1000)])

    const result = await statsService.getProjections('TEST')
    expect(result.insights).toBeDefined()
    expect(result.insights.length).toBeGreaterThan(0)
    // With only 1 year, we get the insufficient data response
    expect(result.insights[0]).toMatch(/Insufficient/i)
  })

  it('handles edge case: 2 years of data', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([
      makeStatYear(2022, 900),
      makeStatYear(2023, 1000),
    ])

    const result = await statsService.getProjections('TEST')
    expect(result.currentRate).toBeDefined()
    expect(result.points5.length).toBe(5)
  })

  it('handles empty stats array', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([])

    const result = await statsService.getProjections('TEST')
    expect(result.insights[0]).toMatch(/Insufficient/i)
  })
})
