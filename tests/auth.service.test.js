/**
 * auth.service.js — comprehensive tests
 *
 * Covers all 8 forgot-password security fixes:
 *  #1  Post-reset security notification email
 *  #2  resetEmailSentAt only written after confirmed SMTP delivery
 *  #3  N/A (frontend — URL token stripping)
 *  #4  Deactivated accounts silently skipped
 *  #5  OAuth-only accounts get notice email instead of reset link
 *  #6  resetEmailSentAt kept after successful reset (no immediate re-request)
 *  #7  N/A (admin service — separate test file)
 *  #8  changedAt timestamp in security alert email
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks (hoisted before imports) ────────────────────────────────────

vi.mock('../src/repositories/user.repository.js', () => ({
  userRepository: {
    existsByEmail:                  vi.fn(),
    create:                         vi.fn(),
    findByEmail:                    vi.fn(),
    findByEmailWithSensitiveFields: vi.fn(),
    findByIdOrFail:                 vi.fn(),
    findByVerificationToken:        vi.fn(),
    findByResetToken:               vi.fn(),
    findByEmailChangeToken:         vi.fn(),
    findEmailRateLimitFields:       vi.fn(),
    findForPasswordReset:           vi.fn(),
    updateById:                     vi.fn(),
    incrementLoginAttempts:         vi.fn(),
    resetLoginAttempts:             vi.fn(),
    linkOAuthProvider:              vi.fn(),
  },
}))

vi.mock('../src/services/token.service.js', () => ({
  tokenService: {
    issueTokenPair:           vi.fn().mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' }),
    verifyAndRotateRefresh:   vi.fn(),
    revokeTokens:             vi.fn(),
    getRefreshCookieOptions:  vi.fn(),
  },
}))

vi.mock('../src/lib/crypto.js', () => ({
  crypto: {
    hash:      vi.fn().mockResolvedValue('hashed_password'),
    compare:   vi.fn(),
    hashToken: vi.fn(t => `sha256:${t}`),
  },
}))

vi.mock('../src/lib/email.js', () => ({
  email: {
    sendVerification:        vi.fn().mockResolvedValue(undefined),
    sendPasswordReset:       vi.fn().mockResolvedValue(undefined),
    sendPasswordChangedAlert:vi.fn().mockResolvedValue(undefined),
    sendOAuthOnlyNotice:     vi.fn().mockResolvedValue(undefined),
    sendAdminPasswordReset:  vi.fn().mockResolvedValue(undefined),
    sendEmailChange:         vi.fn().mockResolvedValue(undefined),
  },
}))

// ── Imports (after mocks) ────────────────────────────────────────────────────
import { authService } from '../src/services/auth.service.js'
import { userRepository } from '../src/repositories/user.repository.js'
import { email } from '../src/lib/email.js'
import { crypto } from '../src/lib/crypto.js'

// ── Helpers ──────────────────────────────────────────────────────────────────
const ONE_HOUR_MS = 60 * 60 * 1000

function makeUser(overrides = {}) {
  return {
    _id:         'user123',
    name:        'Test User',
    email:       'test@example.com',
    password:    'hashed_pw',
    isActive:    true,
    oauthProviders: [],
    resetEmailSentAt: null,
    loginAttempts: 0,
    lockUntil:   null,
    mustChangePassword: false,
    ...overrides,
  }
}

// ── forgotPassword ───────────────────────────────────────────────────────────

describe('authService.forgotPassword', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns silently when user not found — no enumeration', async () => {
    userRepository.findForPasswordReset.mockResolvedValue(null)
    await expect(authService.forgotPassword('nobody@example.com')).resolves.toBeUndefined()
    expect(email.sendPasswordReset).not.toHaveBeenCalled()
  })

  // Issue #4 — deactivated accounts
  it('skips silently for deactivated accounts — no token saved, no email sent', async () => {
    userRepository.findForPasswordReset.mockResolvedValue(makeUser({ isActive: false }))
    await expect(authService.forgotPassword('test@example.com')).resolves.toBeUndefined()
    expect(userRepository.updateById).not.toHaveBeenCalled()
    expect(email.sendPasswordReset).not.toHaveBeenCalled()
    expect(email.sendOAuthOnlyNotice).not.toHaveBeenCalled()
  })

  // Issue #5 — OAuth-only accounts
  it('sends OAuthOnlyNotice for accounts with no password set', async () => {
    userRepository.findForPasswordReset.mockResolvedValue(makeUser({ password: null }))
    await authService.forgotPassword('test@example.com')
    expect(email.sendOAuthOnlyNotice).toHaveBeenCalledWith('test@example.com')
    expect(email.sendPasswordReset).not.toHaveBeenCalled()
    expect(userRepository.updateById).not.toHaveBeenCalled()
  })

  it('throws ResetRateLimitError when per-email cooldown has not elapsed', async () => {
    const sentRecently = new Date(Date.now() - 5 * 60 * 1000) // 5 min ago < 1 hour
    userRepository.findForPasswordReset.mockResolvedValue(makeUser({ resetEmailSentAt: sentRecently }))
    const { ResetRateLimitError } = await import('../src/core/errors/index.js')
    await expect(authService.forgotPassword('test@example.com')).rejects.toBeInstanceOf(ResetRateLimitError)
    expect(email.sendPasswordReset).not.toHaveBeenCalled()
  })

  it('allows reset when cooldown has fully elapsed', async () => {
    const sentLongAgo = new Date(Date.now() - ONE_HOUR_MS - 1000)
    userRepository.findForPasswordReset.mockResolvedValue(makeUser({ resetEmailSentAt: sentLongAgo }))
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendPasswordReset.mockResolvedValue(undefined)

    await authService.forgotPassword('test@example.com')
    expect(email.sendPasswordReset).toHaveBeenCalledOnce()
  })

  // Issue #2 — write token first, resetEmailSentAt only after delivery
  it('writes token to DB before sending email', async () => {
    const callOrder = []
    userRepository.findForPasswordReset.mockResolvedValue(makeUser())
    userRepository.updateById.mockImplementation((_id, fields) => {
      if (fields.passwordResetToken) callOrder.push('db:token')
      if (fields.resetEmailSentAt)   callOrder.push('db:sentAt')
      return Promise.resolve()
    })
    email.sendPasswordReset.mockImplementation(() => {
      callOrder.push('email:sent')
      return Promise.resolve()
    })

    await authService.forgotPassword('test@example.com')

    expect(callOrder[0]).toBe('db:token')
    expect(callOrder[1]).toBe('email:sent')
    expect(callOrder[2]).toBe('db:sentAt')
  })

  // Issue #2 — SMTP failure must NOT set resetEmailSentAt
  it('does NOT write resetEmailSentAt when email delivery fails', async () => {
    userRepository.findForPasswordReset.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendPasswordReset.mockRejectedValue(new Error('SMTP timeout'))

    await authService.forgotPassword('test@example.com')

    // First updateById call saves the token — that's fine
    // Second updateById (for resetEmailSentAt) must NOT happen
    const sentAtCall = userRepository.updateById.mock.calls.find(
      ([, fields]) => fields.resetEmailSentAt != null
    )
    expect(sentAtCall).toBeUndefined()
  })

  it('writes resetEmailSentAt on successful email delivery', async () => {
    userRepository.findForPasswordReset.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendPasswordReset.mockResolvedValue(undefined)

    await authService.forgotPassword('test@example.com')

    const sentAtCall = userRepository.updateById.mock.calls.find(
      ([, fields]) => fields.resetEmailSentAt != null
    )
    expect(sentAtCall).toBeDefined()
    expect(sentAtCall[0]).toBe('user123')
  })

  it('passes hashed token (not raw) to DB', async () => {
    userRepository.findForPasswordReset.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendPasswordReset.mockResolvedValue(undefined)

    await authService.forgotPassword('test@example.com')

    const tokenCall = userRepository.updateById.mock.calls.find(
      ([, fields]) => fields.passwordResetToken != null
    )
    // hashToken mock prefixes sha256: — raw token would not have that prefix
    expect(tokenCall[1].passwordResetToken).toMatch(/^sha256:/)
  })

  it('passes raw token (not hashed) to the email', async () => {
    userRepository.findForPasswordReset.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendPasswordReset.mockResolvedValue(undefined)

    await authService.forgotPassword('test@example.com')

    const [, rawToken] = email.sendPasswordReset.mock.calls[0]
    // Raw token should NOT start with 'sha256:' (that's the hashed form)
    expect(rawToken).not.toMatch(/^sha256:/)
    expect(typeof rawToken).toBe('string')
    expect(rawToken.length).toBeGreaterThan(0)
  })
})

// ── resetPassword ────────────────────────────────────────────────────────────

describe('authService.resetPassword', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws INVALID_TOKEN for an unrecognised or expired token', async () => {
    userRepository.findByResetToken.mockResolvedValue(null)
    const { AppError } = await import('../src/core/errors/index.js')
    await expect(authService.resetPassword('badtoken', 'NewPassword123!')).rejects.toMatchObject({
      code: 'INVALID_TOKEN',
    })
  })

  it('hashes the new password and saves it', async () => {
    userRepository.findByResetToken.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendPasswordChangedAlert.mockResolvedValue(undefined)

    await authService.resetPassword('validtoken', 'NewPassword123!')

    expect(crypto.hash).toHaveBeenCalledWith('NewPassword123!')
    const [, fields] = userRepository.updateById.mock.calls[0]
    expect(fields.password).toBe('hashed_password')
  })

  it('clears passwordResetToken and passwordResetExpires', async () => {
    userRepository.findByResetToken.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendPasswordChangedAlert.mockResolvedValue(undefined)

    await authService.resetPassword('validtoken', 'NewPassword123!')

    const [, fields] = userRepository.updateById.mock.calls[0]
    expect(fields.passwordResetToken).toBeNull()
    expect(fields.passwordResetExpires).toBeNull()
  })

  // Issue #6 — resetEmailSentAt must NOT be cleared after reset
  it('does NOT clear resetEmailSentAt — prevents immediate re-request after reset', async () => {
    userRepository.findByResetToken.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendPasswordChangedAlert.mockResolvedValue(undefined)

    await authService.resetPassword('validtoken', 'NewPassword123!')

    const [, fields] = userRepository.updateById.mock.calls[0]
    expect(fields).not.toHaveProperty('resetEmailSentAt')
  })

  // Issue #1 — security notification email
  it('sends a password-changed security alert email to the account owner', async () => {
    userRepository.findByResetToken.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendPasswordChangedAlert.mockResolvedValue(undefined)

    await authService.resetPassword('validtoken', 'NewPassword123!')

    expect(email.sendPasswordChangedAlert).toHaveBeenCalledWith(
      'test@example.com',
      expect.objectContaining({ changedAt: expect.any(Date) })
    )
  })

  // Issue #8 — changedAt timestamp in alert
  it('passes a changedAt Date to the security alert email', async () => {
    const before = Date.now()
    userRepository.findByResetToken.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendPasswordChangedAlert.mockResolvedValue(undefined)

    await authService.resetPassword('validtoken', 'NewPassword123!')

    const after = Date.now()
    const [, { changedAt }] = email.sendPasswordChangedAlert.mock.calls[0]
    expect(changedAt.getTime()).toBeGreaterThanOrEqual(before)
    expect(changedAt.getTime()).toBeLessThanOrEqual(after)
  })

  it('resets loginAttempts and clears lockUntil', async () => {
    userRepository.findByResetToken.mockResolvedValue(makeUser({ loginAttempts: 5, lockUntil: new Date() }))
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendPasswordChangedAlert.mockResolvedValue(undefined)

    await authService.resetPassword('validtoken', 'NewPassword123!')

    const [, fields] = userRepository.updateById.mock.calls[0]
    expect(fields.loginAttempts).toBe(0)
    expect(fields.lockUntil).toBeNull()
  })

  it('clears mustChangePassword flag on successful reset', async () => {
    userRepository.findByResetToken.mockResolvedValue(makeUser({ mustChangePassword: true }))
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendPasswordChangedAlert.mockResolvedValue(undefined)

    await authService.resetPassword('validtoken', 'NewPassword123!')

    const [, fields] = userRepository.updateById.mock.calls[0]
    expect(fields.mustChangePassword).toBe(false)
  })

  it('sets passwordChangedAt to invalidate existing sessions', async () => {
    userRepository.findByResetToken.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendPasswordChangedAlert.mockResolvedValue(undefined)

    await authService.resetPassword('validtoken', 'NewPassword123!')

    const [, fields] = userRepository.updateById.mock.calls[0]
    expect(fields.passwordChangedAt).toBeInstanceOf(Date)
  })

  it('does not crash if security alert email fails — reset still succeeds', async () => {
    userRepository.findByResetToken.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)
    // Simulate email failure
    email.sendPasswordChangedAlert.mockRejectedValue(new Error('SMTP down'))

    // Should NOT throw — the .catch(() => {}) in service absorbs it
    await expect(authService.resetPassword('validtoken', 'NewPassword123!')).resolves.toBeUndefined()
  })

  it('uses hashed token when looking up the user', async () => {
    userRepository.findByResetToken.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendPasswordChangedAlert.mockResolvedValue(undefined)

    await authService.resetPassword('rawtoken123', 'NewPassword123!')

    expect(userRepository.findByResetToken).toHaveBeenCalledWith('sha256:rawtoken123')
  })
})
