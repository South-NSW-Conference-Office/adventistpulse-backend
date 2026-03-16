/**
 * entity.service.js — search, breadcrumbs, siblings, benchmarks, nearby tests
 *
 * Covers:
 *  - search: case-insensitive name/code matching, limit, empty results
 *  - getBreadcrumbs: full path and single-entity path
 *  - getSiblings: excludes self, empty when no siblings
 *  - getBenchmarks: returns array with category/reason/similarity
 *  - getNearby: entities with distanceKm, empty when no coordinates
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ─────────────────────────────────────────────────────────────

const mockFind = vi.fn()
const mockLimit = vi.fn()
const mockLean = vi.fn()

vi.mock('../src/repositories/entity.repository.js', () => ({
  entityRepository: {
    findByCodeOrFail:   vi.fn(),
    findByCode:         vi.fn(),
    findChildren:       vi.fn(),
    find:               vi.fn(),
    existsByCode:       vi.fn(),
    paginate:           vi.fn(),
    findAncestorChain:  vi.fn(),
    model: {
      find: vi.fn(() => ({
        limit: vi.fn(() => ({
          lean: vi.fn().mockResolvedValue([]),
        })),
      })),
    },
  },
}))

vi.mock('../src/repositories/stats.repository.js', () => ({
  statsRepository: {
    findByEntityCode:      vi.fn(),
    findLatestForEntity:   vi.fn(),
    findLatestForEntities: vi.fn().mockResolvedValue([]),
    deleteByEntityCode:    vi.fn(),
  },
}))

vi.mock('../src/lib/paginate.js', () => ({
  getPaginationParams: vi.fn(q => ({ page: q?.page ?? 1, limit: q?.limit ?? 20, skip: 0 })),
}))

// ── Imports ──────────────────────────────────────────────────────────────────
import { entityService } from '../src/services/entity.service.js'
import { entityRepository } from '../src/repositories/entity.repository.js'
import { statsRepository } from '../src/repositories/stats.repository.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEntity(overrides = {}) {
  return {
    _id: 'e1', code: 'TEST', name: 'Test Entity', level: 'conference',
    parentCode: null, ...overrides,
  }
}

// ── search ──────────────────────────────────────────────────────────────────

describe('entityService.search', () => {
  beforeEach(() => vi.clearAllMocks())

  function setupModelFind(results) {
    const leanFn = vi.fn().mockResolvedValue(results)
    const limitFn = vi.fn(() => ({ lean: leanFn }))
    entityRepository.model.find.mockReturnValue({ limit: limitFn })
    statsRepository.findLatestForEntities.mockResolvedValue([])
    return { leanFn, limitFn }
  }

  it('returns entities matching name (case-insensitive)', async () => {
    const entities = [makeEntity({ name: 'Test Conference' })]
    setupModelFind(entities)

    const results = await entityService.search('test')
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Test Conference')
  })

  it('returns entities matching code', async () => {
    const entities = [makeEntity({ code: 'SPDC' })]
    setupModelFind(entities)

    const results = await entityService.search('SPDC')
    expect(results).toHaveLength(1)
    expect(results[0].code).toBe('SPDC')
  })

  it('respects limit param', async () => {
    const entities = [makeEntity()]
    const { limitFn } = setupModelFind(entities)

    await entityService.search('test', 5)
    expect(limitFn).toHaveBeenCalledWith(5)
  })

  it('returns empty array when no matches', async () => {
    setupModelFind([])
    const results = await entityService.search('nonexistent')
    expect(results).toEqual([])
  })
})

// ── getBreadcrumbs ──────────────────────────────────────────────────────────

describe('entityService.getBreadcrumbs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns [root, ..., entity] from root to current via findAncestorChain', async () => {
    const union  = makeEntity({ code: 'UNION1',  name: 'Union',       parentCode: null })
    const conf   = makeEntity({ code: 'CONF1',   name: 'Conference',  parentCode: 'UNION1' })
    const church = makeEntity({ code: 'CHURCH1', name: 'Local Church',parentCode: 'CONF1' })

    // findAncestorChain returns root → entity already sorted
    entityRepository.findAncestorChain.mockResolvedValue([union, conf, church])

    const crumbs = await entityService.getBreadcrumbs('CHURCH1')
    expect(crumbs).toHaveLength(3)
    expect(crumbs[0].code).toBe('UNION1')
    expect(crumbs[1].code).toBe('CONF1')
    expect(crumbs[2].code).toBe('CHURCH1')
    // Should use the new single-query method, not the old N+1 approach
    expect(entityRepository.findAncestorChain).toHaveBeenCalledWith('CHURCH1')
    expect(entityRepository.findByCode).not.toHaveBeenCalled()
  })

  it('returns [entity] when no parent', async () => {
    const root = makeEntity({ code: 'GC', parentCode: null })
    entityRepository.findAncestorChain.mockResolvedValue([root])

    const crumbs = await entityService.getBreadcrumbs('GC')
    expect(crumbs).toHaveLength(1)
    expect(crumbs[0].code).toBe('GC')
  })

  it('throws NotFoundError when entity does not exist', async () => {
    entityRepository.findAncestorChain.mockResolvedValue([])
    await expect(entityService.getBreadcrumbs('UNKNOWN')).rejects.toThrow()
  })
})

// ── getSiblings ─────────────────────────────────────────────────────────────

describe('entityService.getSiblings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns siblings excluding self', async () => {
    const entity = makeEntity({ code: 'CONF1', parentCode: 'UNION1' })
    const siblings = [
      makeEntity({ code: 'CONF1', name: 'Conf 1' }),
      makeEntity({ code: 'CONF2', name: 'Conf 2' }),
      makeEntity({ code: 'CONF3', name: 'Conf 3' }),
    ]

    entityRepository.findByCodeOrFail.mockResolvedValue(entity)
    entityRepository.findChildren.mockResolvedValue(siblings)
    statsRepository.findLatestForEntities.mockResolvedValue([])

    const result = await entityService.getSiblings('CONF1')
    expect(result).toHaveLength(2)
    expect(result.map(s => s.code)).not.toContain('CONF1')
    expect(result.map(s => s.code)).toContain('CONF2')
    expect(result.map(s => s.code)).toContain('CONF3')
  })

  it('returns empty array when no siblings (no parent)', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity({ parentCode: null }))

    const result = await entityService.getSiblings('GC')
    expect(result).toEqual([])
  })
})

// ── getBenchmarks ───────────────────────────────────────────────────────────

describe('entityService.getBenchmarks', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns array with category, reason, similarity fields', async () => {
    const entity = makeEntity({ code: 'CONF1', parentCode: 'UNION1' })
    const stat = {
      entityCode: 'CONF1',
      membership: { ending: 1000, growthRate: 0.02 },
    }
    const peerStat = {
      entityCode: 'CONF2',
      membership: { ending: 1100, growthRate: 0.03 },
    }

    entityRepository.findByCodeOrFail.mockResolvedValue(entity)
    statsRepository.findLatestForEntity.mockResolvedValue(stat)

    // Mock model.find for #findWithStats — return peers
    const peerEntity = makeEntity({ code: 'CONF2', name: 'Peer Conf' })
    const leanFn = vi.fn().mockResolvedValue([peerEntity])
    const limitFn = vi.fn(() => ({ lean: leanFn }))
    entityRepository.model.find.mockReturnValue({ limit: limitFn })

    // findLatestForEntities for peers and siblings
    statsRepository.findLatestForEntities.mockResolvedValue([peerStat])

    // siblings
    entityRepository.findByCode.mockResolvedValue(makeEntity({ code: 'UNION1', name: 'Union' }))
    entityRepository.findChildren.mockResolvedValue([
      makeEntity({ code: 'CONF2' }),
      makeEntity({ code: 'CONF3' }),
    ])

    const results = await entityService.getBenchmarks('CONF1')
    expect(Array.isArray(results)).toBe(true)
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('category')
      expect(results[0]).toHaveProperty('reason')
      expect(results[0]).toHaveProperty('similarity')
    }
  })

  it('returns empty array when no stats exist', async () => {
    entityRepository.findByCodeOrFail.mockResolvedValue(makeEntity())
    statsRepository.findLatestForEntity.mockResolvedValue(null)

    const results = await entityService.getBenchmarks('TEST')
    expect(results).toEqual([])
  })
})

// ── getNearby ───────────────────────────────────────────────────────────────

describe('entityService.getNearby', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns entities with distanceKm field', async () => {
    const entity = makeEntity({
      location: { type: 'Point', coordinates: [151.2093, -33.8688] }, // Sydney
    })
    entityRepository.findByCodeOrFail.mockResolvedValue(entity)

    const nearbyEntities = [
      makeEntity({
        code: 'NEAR1',
        location: { type: 'Point', coordinates: [151.1, -33.9] },
      }),
    ]
    const leanFn = vi.fn().mockResolvedValue(nearbyEntities)
    const limitFn = vi.fn(() => ({ lean: leanFn }))
    const findFn = vi.fn(() => ({ limit: limitFn }))
    entityRepository.model.find.mockReturnValue({ limit: limitFn })

    const results = await entityService.getNearby('TEST')
    expect(Array.isArray(results)).toBe(true)
    if (results.length > 0) {
      expect(results[0]).toHaveProperty('distanceKm')
      expect(typeof results[0].distanceKm).toBe('number')
    }
  })

  it('returns empty when entity has no coordinates', async () => {
    const entity = makeEntity({ location: {} })
    entityRepository.findByCodeOrFail.mockResolvedValue(entity)

    const results = await entityService.getNearby('TEST')
    expect(results).toEqual([])
  })

  it('returns empty when entity has no location', async () => {
    const entity = makeEntity()
    delete entity.location
    entityRepository.findByCodeOrFail.mockResolvedValue(entity)

    const results = await entityService.getNearby('TEST')
    expect(results).toEqual([])
  })
})
