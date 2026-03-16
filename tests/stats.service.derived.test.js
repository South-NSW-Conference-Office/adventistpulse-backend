/**
 * stats.service.js — #computeDerivedFields() tests
 *
 * Tests derived membership fields computed during importStats:
 *  - retentionRate, dropoutRate, lossRate, accessionRate, totalAccessions
 *  - derived.tithePerCapita, derived.membersPerWorker
 *  - Edge cases (beginning=0, ending=0, missing workers)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks (hoisted before imports) ────────────────────────────────────

vi.mock('../src/repositories/entity.repository.js', () => ({
  entityRepository: {
    findByCodeOrFail: vi.fn().mockResolvedValue({ _id: 'e1', code: 'TEST', name: 'Test Entity' }),
  },
}))

vi.mock('../src/repositories/stats.repository.js', () => ({
  statsRepository: {
    findByEntityCode: vi.fn(),
    upsert:           vi.fn(),
    findLatestForEntity: vi.fn(),
    findLatestForEntities: vi.fn(),
    getRankings:      vi.fn(),
    countRankings:    vi.fn(),
    getMapData:       vi.fn(),
    getCountryTrend:  vi.fn(),
    getCountrySummary: vi.fn(),
    getCountryRankings: vi.fn(),
  },
}))

// ── Imports (after mocks) ────────────────────────────────────────────────────
import { statsService } from '../src/services/stats.service.js'
import { statsRepository } from '../src/repositories/stats.repository.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeStat(overrides = {}) {
  return {
    year: 2023,
    membership: {
      beginning: 1000,
      ending: 950,
      baptisms: 30,
      professionOfFaith: 10,
      transfersIn: 20,
      deaths: 15,
      dropped: 40,
      missing: 25,
      transfersOut: 30,
      ...overrides.membership,
    },
    workers: { totalWorkers: 10, ...overrides.workers },
    finance: { tithe: 95000, ...overrides.finance },
    ...overrides,
  }
}

// ── #computeDerivedFields (via importStats) ──────────────────────────────────

describe('statsService.importStats — #computeDerivedFields', () => {
  beforeEach(() => vi.clearAllMocks())

  // Helper: call importStats with a single stat and capture the enriched object
  async function importAndCapture(stat) {
    statsRepository.upsert.mockResolvedValue({})
    await statsService.importStats({ entityCode: 'TEST', stats: [stat] })
    return statsRepository.upsert.mock.calls[0][2] // enriched stat
  }

  it('retentionRate is null when beginning=0', async () => {
    const enriched = await importAndCapture(makeStat({ membership: { beginning: 0 } }))
    expect(enriched.membership.retentionRate).toBeNull()
  })

  it('retentionRate computed correctly: (1 - (dropped+missing)/beginning) * 100', async () => {
    const stat = makeStat() // beginning=1000, dropped=40, missing=25
    const enriched = await importAndCapture(stat)
    const expected = parseFloat(((1 - (40 + 25) / 1000) * 100).toFixed(6))
    expect(enriched.membership.retentionRate).toBe(expected)
  })

  it('dropoutRate computed correctly', async () => {
    const stat = makeStat() // beginning=1000, dropped=40, missing=25
    const enriched = await importAndCapture(stat)
    const expected = parseFloat((((40 + 25) / 1000) * 100).toFixed(6))
    expect(enriched.membership.dropoutRate).toBe(expected)
  })

  it('lossRate computed correctly', async () => {
    const stat = makeStat() // deaths=15, dropped=40, missing=25, transfersOut=30 → totalLosses=110
    const enriched = await importAndCapture(stat)
    const totalLosses = 15 + 40 + 25 + 30
    const expected = parseFloat(((totalLosses / 1000) * 100).toFixed(6))
    expect(enriched.membership.lossRate).toBe(expected)
  })

  it('accessionRate computed correctly', async () => {
    const stat = makeStat() // baptisms=30, professionOfFaith=10 → totalAccessions=40
    const enriched = await importAndCapture(stat)
    const expected = parseFloat(((40 / 1000) * 100).toFixed(6))
    expect(enriched.membership.accessionRate).toBe(expected)
  })

  it('totalAccessions = baptisms + professionOfFaith', async () => {
    const stat = makeStat() // baptisms=30, professionOfFaith=10
    const enriched = await importAndCapture(stat)
    expect(enriched.membership.totalAccessions).toBe(40)
  })

  it('derived.tithePerCapita = tithe / ending (null if ending=0)', async () => {
    const stat = makeStat() // tithe=95000, ending=950
    const enriched = await importAndCapture(stat)
    const expected = parseFloat((95000 / 950).toFixed(6))
    expect(enriched.derived.tithePerCapita).toBe(expected)
  })

  it('derived.tithePerCapita is null when ending=0', async () => {
    const stat = makeStat({ membership: { ending: 0 } })
    const enriched = await importAndCapture(stat)
    expect(enriched.derived.tithePerCapita).toBeNull()
  })

  it('derived.membersPerWorker = ending / totalWorkers (null if totalWorkers missing)', async () => {
    const stat = makeStat() // ending=950, totalWorkers=10
    const enriched = await importAndCapture(stat)
    const expected = parseFloat((950 / 10).toFixed(6))
    expect(enriched.derived.membersPerWorker).toBe(expected)
  })

  it('derived.membersPerWorker is null when totalWorkers is 0', async () => {
    const stat = makeStat({ workers: { totalWorkers: 0 } })
    const enriched = await importAndCapture(stat)
    expect(enriched.derived.membersPerWorker).toBeNull()
  })

  it('derived.membersPerWorker is null when workers object is empty', async () => {
    const stat = makeStat({ workers: {} })
    // Remove totalWorkers entirely
    delete stat.workers.totalWorkers
    const enriched = await importAndCapture(stat)
    expect(enriched.derived.membersPerWorker).toBeNull()
  })

  it('all rates use parseFloat with 6 decimal places', async () => {
    const stat = makeStat({
      membership: {
        beginning: 333,
        ending: 300,
        baptisms: 7,
        professionOfFaith: 3,
        transfersIn: 5,
        deaths: 4,
        dropped: 12,
        missing: 8,
        transfersOut: 6,
      },
    })
    const enriched = await importAndCapture(stat)

    // Check that rates have at most 6 decimal places
    const checkPrecision = (val) => {
      if (val == null) return true
      const str = val.toString()
      const decimals = str.includes('.') ? str.split('.')[1].length : 0
      return decimals <= 6
    }

    expect(checkPrecision(enriched.membership.retentionRate)).toBe(true)
    expect(checkPrecision(enriched.membership.dropoutRate)).toBe(true)
    expect(checkPrecision(enriched.membership.lossRate)).toBe(true)
    expect(checkPrecision(enriched.membership.accessionRate)).toBe(true)
    expect(checkPrecision(enriched.membership.growthRate)).toBe(true)
  })

  it('dropoutRate is null when beginning=0', async () => {
    const enriched = await importAndCapture(makeStat({ membership: { beginning: 0 } }))
    expect(enriched.membership.dropoutRate).toBeNull()
  })

  it('lossRate is null when beginning=0', async () => {
    const enriched = await importAndCapture(makeStat({ membership: { beginning: 0 } }))
    expect(enriched.membership.lossRate).toBeNull()
  })

  it('accessionRate is null when beginning=0', async () => {
    const enriched = await importAndCapture(makeStat({ membership: { beginning: 0 } }))
    expect(enriched.membership.accessionRate).toBeNull()
  })
})
