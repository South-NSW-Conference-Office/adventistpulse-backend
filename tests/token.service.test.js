import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../src/lib/jwt.js', () => ({
  jwt: {
    SALTS: { access: 'pulse.access_token', refresh: 'pulse.refresh_token' },
    issueAccessToken:  vi.fn().mockResolvedValue('mock-access-token'),
    issueRefreshToken: vi.fn().mockResolvedValue('mock-refresh-token'),
    verifyAccessToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
    isExpiringSoon: vi.fn().mockReturnValue(false),
    timeUntilExpiry: vi.fn().mockReturnValue(900),
  },
}))

vi.mock('../src/config/env.js', () => ({
  env: {
    JWT_ACCESS_EXPIRY_SECONDS:       900,
    JWT_REFRESH_EXPIRY_SECONDS:      604800,
    JWT_REMEMBER_ME_EXPIRY_SECONDS:  2592000,
    NODE_ENV: 'test',
  },
}))

vi.mock('../src/repositories/tokenBlacklist.repository.js', () => ({
  tokenBlacklistRepository: {
    atomicBlacklist: vi.fn().mockResolvedValue(undefined),
    blacklist:       vi.fn().mockResolvedValue(undefined),
    isBlacklisted:   vi.fn().mockResolvedValue(false),
  },
}))

// ── Imports (after mocks) ────────────────────────────────────────────────────
const { tokenService } = await import('../src/services/token.service.js')
const { jwt }          = await import('../src/lib/jwt.js')
const { tokenBlacklistRepository } = await import('../src/repositories/tokenBlacklist.repository.js')

// ── Tests ────────────────────────────────────────────────────────────────────

describe('TokenService', () => {
  const mockUser = {
    _id:          { toString: () => 'user-id-123' },
    name:         'Test User',
    email:        'test@example.com',
    role:         'viewer',
    entityAccess: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buildAccessPayload', () => {
    it('includes required fields', () => {
      const payload = tokenService.buildAccessPayload(mockUser)
      expect(payload.sub).toBe('user-id-123')
      expect(payload.email).toBe('test@example.com')
      expect(payload.role).toBe('viewer')
      expect(payload.entityAccess).toEqual([])
    })

    it('defaults entityAccess to [] when undefined', () => {
      const payload = tokenService.buildAccessPayload({ ...mockUser, entityAccess: undefined })
      expect(payload.entityAccess).toEqual([])
    })
  })

  describe('buildRefreshPayload', () => {
    it('contains only sub', () => {
      const payload = tokenService.buildRefreshPayload(mockUser)
      expect(payload.sub).toBe('user-id-123')
      expect(Object.keys(payload)).toEqual(['sub'])
    })
  })

  describe('issueTokenPair', () => {
    it('returns access and refresh tokens', async () => {
      const result = await tokenService.issueTokenPair(mockUser)
      expect(result.accessToken).toBe('mock-access-token')
      expect(result.refreshToken).toBe('mock-refresh-token')
    })

    it('uses standard refresh expiry by default', async () => {
      await tokenService.issueTokenPair(mockUser)
      expect(jwt.issueRefreshToken).toHaveBeenCalledWith(
        expect.anything(),
        604800,
      )
    })

    it('uses remember-me expiry when rememberMe=true', async () => {
      await tokenService.issueTokenPair(mockUser, { rememberMe: true })
      expect(jwt.issueRefreshToken).toHaveBeenCalledWith(
        expect.anything(),
        2592000,
      )
    })
  })

  describe('verifyAndRotateRefresh', () => {
    it('returns payload on valid token', async () => {
      jwt.verifyRefreshToken.mockResolvedValue({ sub: 'user-id-123', jti: 'jti-abc', exp: 9999999999 })
      const result = await tokenService.verifyAndRotateRefresh('valid-refresh-token')
      expect(result.sub).toBe('user-id-123')
      expect(tokenBlacklistRepository.atomicBlacklist).toHaveBeenCalledWith('jti-abc', expect.any(Date))
    })

    it('throws when refreshToken is missing', async () => {
      await expect(tokenService.verifyAndRotateRefresh(null)).rejects.toThrow()
    })

    it('throws when payload has no jti', async () => {
      jwt.verifyRefreshToken.mockResolvedValue({ sub: 'user-id-123' }) // no jti
      await expect(tokenService.verifyAndRotateRefresh('bad-token')).rejects.toThrow()
    })
  })

  describe('revokeTokens', () => {
    it('blacklists refresh token', async () => {
      jwt.verifyRefreshToken.mockResolvedValue({ jti: 'refresh-jti', exp: 9999999999 })
      jwt.verifyAccessToken.mockResolvedValue({ jti: 'access-jti', exp: 9999999999 })

      await tokenService.revokeTokens('access-tok', 'refresh-tok')
      expect(tokenBlacklistRepository.blacklist).toHaveBeenCalledWith('refresh-jti', expect.any(Date), 'refresh')
      expect(tokenBlacklistRepository.blacklist).toHaveBeenCalledWith('access-jti', expect.any(Date), 'access')
    })

    it('does not throw if tokens are already expired', async () => {
      jwt.verifyRefreshToken.mockRejectedValue(new Error('expired'))
      jwt.verifyAccessToken.mockRejectedValue(new Error('expired'))
      await expect(tokenService.revokeTokens('bad', 'bad')).resolves.not.toThrow()
    })
  })

  describe('getRefreshCookieOptions', () => {
    it('sets httpOnly and path=/api', () => {
      const opts = tokenService.getRefreshCookieOptions(604800)
      expect(opts.httpOnly).toBe(true)
      expect(opts.path).toBe('/api')
      expect(opts.maxAge).toBe(604800 * 1000)
    })

    it('sets secure=false and sameSite=lax in test/dev', () => {
      const opts = tokenService.getRefreshCookieOptions()
      expect(opts.secure).toBe(false)
      expect(opts.sameSite).toBe('lax')
    })
  })

  describe('isExpiringSoon', () => {
    it('delegates to jwt.isExpiringSoon', () => {
      jwt.isExpiringSoon.mockReturnValue(true)
      const payload = { exp: 9999999999, iat: 0 }
      expect(tokenService.isExpiringSoon(payload)).toBe(true)
    })
  })
})
