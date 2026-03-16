/**
 * risk.service.js — comprehensive tests
 *
 * Covers:
 *  - assessRisk flag levels (growth, retention, accession, loss)
 *  - consecutiveDeclineYears calculation
 *  - projectedZeroYear computation
 *  - overallRisk reflects worst flag
 *  - assessRiskBulk
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
    findByEntityCode: vi.fn(),
  },
}))

// ── Imports ──────────────────────────────────────────────────────────────────
import { riskService } from '../src/services/risk.service.js'
import { entityRepository } from '../src/repositories/entity.repository.js'
import { statsRepository } from '../src/repositories/stats.repository.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEntity(overrides = {}) {
  return { _id: 'e1', code: 'TEST', name: 'Test Entity', level: 'conference', ...overrides }
}

function makeStatYear(year, membership = {}, overrides = {}) {
  return {
    year,
    entityCode: 'TEST',
    membership: {
      beginning: 1000,
      ending: 1000,
      growthRate: 0,
      retentionRate: 98,
      accessionRate: 3,
      lossRate: 2,
      totalAccessions: 30,
      ...membership,
    },
    ...overrides,
  }
}

// ── assessRisk ──────────────────────────────────────────────────────────────

describe('riskService.assessRisk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns "healthy" when all metrics are fine', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([
      makeStatYear(2023, { growthRate: 0.02, retentionRate: 98, accessionRate: 3, lossRate: 2 }),
    ])

    const result = await riskService.assessRisk('TEST')
    expect(result.overallRisk).toBe('healthy')
    expect(result.flags).toHaveLength(0)
  })

  it('flags critical "Severe Decline" when growthRate < -0.03', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([
      makeStatYear(2023, { growthRate: -0.05 }),
    ])

    const result = await riskService.assessRisk('TEST')
    const flag = result.flags.find(f => f.label === 'Severe Decline')
    expect(flag).toBeDefined()
    expect(flag.level).toBe('critical')
  })

  it('flags warning "Declining" when growthRate between -0.03 and -0.01', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([
      makeStatYear(2023, { growthRate: -0.02 }), // -2% → netGrowthRate = -2, which is between -3 and -1
    ])

    const result = await riskService.assessRisk('TEST')
    const flag = result.flags.find(f => f.label === 'Declining')
    expect(flag).toBeDefined()
    expect(flag.level).toBe('warning')
  })

  it('flags watch "Slight Decline" when growthRate between -0.01 and 0', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([
      makeStatYear(2023, { growthRate: -0.005 }), // -0.5% → netGrowthRate = -0.5
    ])

    const result = await riskService.assessRisk('TEST')
    const flag = result.flags.find(f => f.label === 'Slight Decline')
    expect(flag).toBeDefined()
    expect(flag.level).toBe('watch')
  })

  it('consecutiveDeclineYears computed correctly from historical stats', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([
      makeStatYear(2023, { growthRate: -0.01 }),
      makeStatYear(2022, { growthRate: -0.02 }),
      makeStatYear(2021, { growthRate: -0.005 }),
      makeStatYear(2020, { growthRate: 0.01 }), // positive — breaks the streak
      makeStatYear(2019, { growthRate: -0.03 }),
    ])

    const result = await riskService.assessRisk('TEST')
    expect(result.consecutiveDeclineYears).toBe(3)
  })

  it('projectedZeroYear is null when growth is positive', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([
      makeStatYear(2023, { growthRate: 0.02, ending: 1000 }),
    ])

    const result = await riskService.assessRisk('TEST')
    expect(result.projectedZeroYear).toBeNull()
  })

  it('projectedZeroYear is computed when declining', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([
      makeStatYear(2023, { growthRate: -0.05, ending: 500 }),
    ])

    const result = await riskService.assessRisk('TEST')
    expect(result.projectedZeroYear).not.toBeNull()
    expect(result.projectedZeroYear).toBeGreaterThan(2023)
  })

  it('retentionRate < 90 → critical flag', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([
      makeStatYear(2023, { growthRate: 0.01, retentionRate: 85 }),
    ])

    const result = await riskService.assessRisk('TEST')
    const flag = result.flags.find(f => f.category === 'retention')
    expect(flag).toBeDefined()
    expect(flag.level).toBe('critical')
    expect(flag.label).toBe('Severe Retention Crisis')
  })

  it('retentionRate < 95 → warning flag', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([
      makeStatYear(2023, { growthRate: 0.01, retentionRate: 92 }),
    ])

    const result = await riskService.assessRisk('TEST')
    const flag = result.flags.find(f => f.category === 'retention')
    expect(flag).toBeDefined()
    expect(flag.level).toBe('warning')
  })

  it('accessionRate < 1 → critical flag', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([
      makeStatYear(2023, { growthRate: 0.01, accessionRate: 0.5 }),
    ])

    const result = await riskService.assessRisk('TEST')
    const flag = result.flags.find(f => f.category === 'accession')
    expect(flag).toBeDefined()
    expect(flag.level).toBe('critical')
  })

  it('lossRate > 5 → warning flag', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([
      makeStatYear(2023, { growthRate: 0.01, lossRate: 7 }),
    ])

    const result = await riskService.assessRisk('TEST')
    const flag = result.flags.find(f => f.category === 'loss')
    expect(flag).toBeDefined()
    expect(flag.level).toBe('warning')
  })

  it('overallRisk reflects worst flag level', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([
      makeStatYear(2023, {
        growthRate: -0.005,   // watch (slight decline)
        retentionRate: 85,    // critical
        accessionRate: 3,
        lossRate: 2,
      }),
    ])

    const result = await riskService.assessRisk('TEST')
    expect(result.overallRisk).toBe('critical')
  })

  it('returns healthy with no stats', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findByEntityCode.mockResolvedValue([])

    const result = await riskService.assessRisk('TEST')
    expect(result.overallRisk).toBe('healthy')
    expect(result.consecutiveDeclineYears).toBe(0)
    expect(result.projectedZeroYear).toBeNull()
  })

  it('throws NotFoundError for unknown code', async () => {
    const { NotFoundError } = await import('../src/core/errors/index.js')
    entityRepository.findByCodeOrFail.mockRejectedValue(new NotFoundError("Entity 'UNKNOWN'"))

    await expect(riskService.assessRisk('UNKNOWN')).rejects.toBeInstanceOf(NotFoundError)
  })
})

// ── assessRiskBulk ──────────────────────────────────────────────────────────

describe('riskService.assessRiskBulk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns array of assessments', async () => {
    entityRepository.find.mockResolvedValue([
      makeEntity({ code: 'A' }),
      makeEntity({ code: 'B' }),
    ])
    entityRepository.findByCodeOrFail
      .mockResolvedValueOnce(makeEntity({ code: 'A' }))
      .mockResolvedValueOnce(makeEntity({ code: 'B' }))
    statsRepository.findByEntityCode
      .mockResolvedValueOnce([makeStatYear(2023, { growthRate: 0.02 })])
      .mockResolvedValueOnce([makeStatYear(2023, { growthRate: -0.05 })])

    const results = await riskService.assessRiskBulk({ level: 'conference' })
    expect(Array.isArray(results)).toBe(true)
    expect(results).toHaveLength(2)
    expect(results[0]).toHaveProperty('overallRisk')
    expect(results[1]).toHaveProperty('overallRisk')
  })
})
