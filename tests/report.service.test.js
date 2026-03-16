import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../src/repositories/report.repository.js', () => ({
  reportRepository: {
    paginate:         vi.fn(),
    findBySlugOrFail: vi.fn(),
    upsertBySlug:     vi.fn(),
  },
}))

vi.mock('../src/lib/paginate.js', () => ({
  getPaginationParams: vi.fn(() => ({ page: 1, limit: 20 })),
}))

// ── Imports (after mocks) ────────────────────────────────────────────────────
const { reportService }      = await import('../src/services/report.service.js')
const { reportRepository }   = await import('../src/repositories/report.repository.js')

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ReportService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('list', () => {
    it('returns paginated reports', async () => {
      reportRepository.paginate.mockResolvedValue({ data: [{ slug: 'r1' }], total: 1 })
      const result = await reportService.list({})
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('applies type filter', async () => {
      reportRepository.paginate.mockResolvedValue({ data: [], total: 0 })
      await reportService.list({ type: 'brief' })
      expect(reportRepository.paginate).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'brief' }),
        expect.anything(),
      )
    })

    it('applies featured filter when truthy string', async () => {
      reportRepository.paginate.mockResolvedValue({ data: [], total: 0 })
      await reportService.list({ featured: 'true' })
      expect(reportRepository.paginate).toHaveBeenCalledWith(
        expect.objectContaining({ featured: true }),
        expect.anything(),
      )
    })

    it('converts year to number', async () => {
      reportRepository.paginate.mockResolvedValue({ data: [], total: 0 })
      await reportService.list({ year: '2023' })
      expect(reportRepository.paginate).toHaveBeenCalledWith(
        expect.objectContaining({ year: 2023 }),
        expect.anything(),
      )
    })
  })

  describe('getBySlug', () => {
    it('delegates to repository', async () => {
      reportRepository.findBySlugOrFail.mockResolvedValue({ slug: 'test-report', title: 'Test' })
      const result = await reportService.getBySlug('test-report')
      expect(result.slug).toBe('test-report')
    })
  })

  describe('create', () => {
    it('delegates upsert to repository (no direct model access)', async () => {
      const data = { slug: 'new-report', title: 'New Report', type: 'brief' }
      reportRepository.upsertBySlug.mockResolvedValue(data)
      const result = await reportService.create(data)
      expect(reportRepository.upsertBySlug).toHaveBeenCalledWith('new-report', data)
      expect(result.slug).toBe('new-report')
    })
  })
})
