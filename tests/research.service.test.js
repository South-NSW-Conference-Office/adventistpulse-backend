import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../src/repositories/research.repository.js', () => ({
  researchRepository: {
    paginate:       vi.fn(),
    findByIdOrFail: vi.fn(),
    findFeatured:   vi.fn(),
  },
}))

vi.mock('../src/lib/paginate.js', () => ({
  getPaginationParams: vi.fn(() => ({ page: 1, limit: 20 })),
}))

// ── Imports (after mocks) ────────────────────────────────────────────────────
const { researchService }      = await import('../src/services/research.service.js')
const { researchRepository }   = await import('../src/repositories/research.repository.js')

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ResearchService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('list', () => {
    it('returns paginated papers', async () => {
      researchRepository.paginate.mockResolvedValue({ data: [{ id: 'paper-1' }], total: 1 })
      const result = await researchService.list({})
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('applies status filter', async () => {
      researchRepository.paginate.mockResolvedValue({ data: [], total: 0 })
      await researchService.list({ status: 'published' })
      expect(researchRepository.paginate).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'published' }),
        expect.anything(),
      )
    })

    it('applies tag filter', async () => {
      researchRepository.paginate.mockResolvedValue({ data: [], total: 0 })
      await researchService.list({ tag: 'baptism' })
      expect(researchRepository.paginate).toHaveBeenCalledWith(
        expect.objectContaining({ tags: 'baptism' }),
        expect.anything(),
      )
    })

    it('applies title regex for search', async () => {
      researchRepository.paginate.mockResolvedValue({ data: [], total: 0 })
      await researchService.list({ search: 'growth' })
      expect(researchRepository.paginate).toHaveBeenCalledWith(
        expect.objectContaining({ title: { $regex: 'growth', $options: 'i' } }),
        expect.anything(),
      )
    })

    it('applies featured filter', async () => {
      researchRepository.paginate.mockResolvedValue({ data: [], total: 0 })
      await researchService.list({ featured: 'true' })
      expect(researchRepository.paginate).toHaveBeenCalledWith(
        expect.objectContaining({ featured: true }),
        expect.anything(),
      )
    })
  })

  describe('getById', () => {
    it('delegates to repository', async () => {
      researchRepository.findByIdOrFail.mockResolvedValue({ id: 'paper-1', title: 'Growth Study' })
      const result = await researchService.getById('paper-1')
      expect(result.title).toBe('Growth Study')
      expect(researchRepository.findByIdOrFail).toHaveBeenCalledWith('paper-1')
    })
  })

  describe('getFeatured', () => {
    it('delegates to repository', async () => {
      researchRepository.findFeatured.mockResolvedValue([{ id: 'featured-1', featured: true }])
      const result = await researchService.getFeatured()
      expect(result).toHaveLength(1)
      expect(result[0].featured).toBe(true)
    })
  })
})
