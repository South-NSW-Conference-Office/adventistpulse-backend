/**
 * Tests for survey.service.js — assertChurchInConference (refactored in PR #16)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Chainable mock factory ────────────────────────────────────────────────────
const chain = (resolveWith) => ({
  lean:   vi.fn().mockResolvedValue(resolveWith),
  select: vi.fn().mockReturnThis(),
  sort:   vi.fn().mockReturnThis(),
})

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockFindOne        = vi.fn()
const mockGetChurchCodes = vi.fn()

vi.mock('../src/models/OrgUnit.js', () => ({
  OrgUnit: { findOne: (...a) => mockFindOne(...a) },
}))
vi.mock('../src/lib/church.js', () => ({
  getChurchCodesForConference: (...a) => mockGetChurchCodes(...a),
}))

const mockSessionExists   = vi.fn()
const mockSessionCreate   = vi.fn()
const mockSessionFind     = vi.fn()
const mockSessionFindById = vi.fn()
const mockSessionUpdateOne = vi.fn()
const mockSessionFindOne  = vi.fn()
const mockSessionCountDocs = vi.fn()

vi.mock('../src/models/SurveySession.js', () => ({
  SurveySession: {
    findOne:          (...a) => mockSessionFindOne(...a),
    exists:           (...a) => mockSessionExists(...a),
    create:           (...a) => mockSessionCreate(...a),
    find:             (...a) => mockSessionFind(...a),
    countDocuments:   (...a) => mockSessionCountDocs(...a),
    findById:         (...a) => mockSessionFindById(...a),
    updateOne:        (...a) => mockSessionUpdateOne(...a),
  },
}))
vi.mock('../src/models/SurveyResponse.js', () => ({
  SurveyResponse: { create: vi.fn(), aggregate: vi.fn(), find: vi.fn() },
}))
vi.mock('../src/lib/paginate.js', () => ({
  getPaginationParams: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
}))
vi.mock('../src/config/env.js', () => ({
  env: { FRONTEND_URL: 'https://test.example.com' },
}))
vi.mock('qrcode', () => ({
  default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,abc') },
}))
vi.mock('../src/core/errors/index.js', () => ({
  AppError:      class AppError      extends Error { constructor(msg, o) { super(msg); this.code = o?.code; this.statusCode = o?.statusCode } },
  NotFoundError: class NotFoundError extends Error { constructor(msg) { super(msg); this.statusCode = 404 } },
  ForbiddenError:class ForbiddenError extends Error { constructor(msg) { super(msg ?? 'Forbidden'); this.statusCode = 403 } },
}))

const { surveyService } = await import('../src/services/survey.service.js')

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('surveyService.createSession — church validation', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws NotFoundError when churchCode does not exist in OrgUnit', async () => {
    mockFindOne.mockReturnValue(chain(null))  // church not found

    await expect(
      surveyService.createSession('userId', 'SNSW', { churchCode: 'GHOST' })
    ).rejects.toThrow('GHOST')
  })

  it('throws ForbiddenError when church exists but is not in the conference', async () => {
    mockFindOne.mockReturnValue(chain({ code: 'CHU001', level: 'church', parentCode: 'OTHER' }))
    mockGetChurchCodes.mockResolvedValue(new Set(['CHU999']))  // CHU001 not in set

    await expect(
      surveyService.createSession('userId', 'SNSW', { churchCode: 'CHU001' })
    ).rejects.toThrow('CHU001')
  })

  it('passes when church is in conference (direct)', async () => {
    mockFindOne.mockReturnValue(chain({ code: 'CHU001', level: 'church', parentCode: 'SNSW', name: 'Test Church' }))
    mockGetChurchCodes.mockResolvedValue(new Set(['CHU001']))
    mockSessionExists.mockResolvedValue(false)
    mockSessionCreate.mockResolvedValue({
      _id: 'sess1', sessionCode: 'ABC123', qrDataUrl: 'data:...', expiresAt: new Date(), status: 'active',
    })

    const result = await surveyService.createSession('userId', 'SNSW', { churchCode: 'CHU001' })
    expect(result.sessionCode).toBeDefined()
  })

  it('passes when church is nested under an intermediate tier', async () => {
    mockFindOne.mockReturnValue(chain({ code: 'NESTED', level: 'church', parentCode: 'DIST01', name: 'Nested Church' }))
    mockGetChurchCodes.mockResolvedValue(new Set(['NESTED']))  // lib includes nested
    mockSessionExists.mockResolvedValue(false)
    mockSessionCreate.mockResolvedValue({
      _id: 'sess2', sessionCode: 'XYZ789', qrDataUrl: 'data:...', expiresAt: new Date(), status: 'active',
    })

    const result = await surveyService.createSession('userId', 'SNSW', { churchCode: 'NESTED' })
    expect(result.sessionCode).toBeDefined()
  })
})
