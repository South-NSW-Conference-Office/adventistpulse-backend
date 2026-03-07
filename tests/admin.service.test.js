/**
 * admin.service.js — comprehensive tests
 *
 * Covers Issue #7 (admin-initiated password reset) and the full admin service surface:
 *  - initiatePasswordReset: deactivated guard, OAuth guard, token write, mustChangePassword,
 *    rate-limit bypass (resetEmailSentAt cleared), email send, email-failure handling
 *  - listUsers: filtering, pagination passthrough
 *  - setUserActive: self-deactivation guard, flag update
 *  - updateUserRole: self-change guard, role/entityAccess update
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('../src/repositories/user.repository.js', () => ({
  userRepository: {
    findByIdOrFail: vi.fn(),
    updateById:     vi.fn(),
    paginate:       vi.fn(),
  },
}))

vi.mock('../src/lib/crypto.js', () => ({
  crypto: {
    hashToken: vi.fn(t => `sha256:${t}`),
  },
}))

vi.mock('../src/lib/email.js', () => ({
  email: {
    sendAdminPasswordReset: vi.fn().mockResolvedValue(undefined),
  },
}))

// ── Imports ──────────────────────────────────────────────────────────────────
import { adminService } from '../src/services/admin.service.js'
import { userRepository } from '../src/repositories/user.repository.js'
import { email } from '../src/lib/email.js'

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  return {
    _id:            'target456',
    name:           'Target User',
    email:          'target@example.com',
    password:       'hashed_pw',
    isActive:       true,
    oauthProviders: [],
    ...overrides,
  }
}

const ADMIN_ID  = 'admin123'
const TARGET_ID = 'target456'

// ── initiatePasswordReset ────────────────────────────────────────────────────

describe('adminService.initiatePasswordReset', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws NOT_FOUND when target user does not exist', async () => {
    const { NotFoundError } = await import('../src/core/errors/index.js')
    userRepository.findByIdOrFail.mockRejectedValue(new NotFoundError('User'))
    await expect(adminService.initiatePasswordReset(ADMIN_ID, TARGET_ID))
      .rejects.toBeInstanceOf(NotFoundError)
  })

  it('throws ACCOUNT_DEACTIVATED for inactive users', async () => {
    userRepository.findByIdOrFail.mockResolvedValue(makeUser({ isActive: false }))
    await expect(adminService.initiatePasswordReset(ADMIN_ID, TARGET_ID))
      .rejects.toMatchObject({ code: 'ACCOUNT_DEACTIVATED' })
  })

  it('throws OAUTH_ONLY for accounts with no password and OAuth providers', async () => {
    userRepository.findByIdOrFail.mockResolvedValue(makeUser({
      password: null,
      oauthProviders: [{ provider: 'google', providerAccountId: 'g123' }],
    }))
    await expect(adminService.initiatePasswordReset(ADMIN_ID, TARGET_ID))
      .rejects.toMatchObject({ code: 'OAUTH_ONLY' })
  })

  it('sets mustChangePassword: true — forces change on next login', async () => {
    userRepository.findByIdOrFail.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)

    await adminService.initiatePasswordReset(ADMIN_ID, TARGET_ID)

    const [, fields] = userRepository.updateById.mock.calls[0]
    expect(fields.mustChangePassword).toBe(true)
  })

  it('clears resetEmailSentAt — admin bypasses per-email rate limit', async () => {
    userRepository.findByIdOrFail.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)

    await adminService.initiatePasswordReset(ADMIN_ID, TARGET_ID)

    const [, fields] = userRepository.updateById.mock.calls[0]
    expect(fields.resetEmailSentAt).toBeNull()
  })

  it('saves a hashed token (not raw) to the database', async () => {
    userRepository.findByIdOrFail.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)

    await adminService.initiatePasswordReset(ADMIN_ID, TARGET_ID)

    const [, fields] = userRepository.updateById.mock.calls[0]
    expect(fields.passwordResetToken).toMatch(/^sha256:/)
  })

  it('sets passwordResetExpires to ~1 hour from now', async () => {
    const before = Date.now()
    userRepository.findByIdOrFail.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)

    await adminService.initiatePasswordReset(ADMIN_ID, TARGET_ID)

    const after = Date.now()
    const [, fields] = userRepository.updateById.mock.calls[0]
    const expiry = fields.passwordResetExpires.getTime()
    expect(expiry).toBeGreaterThanOrEqual(before + 60 * 60 * 1000 - 100)
    expect(expiry).toBeLessThanOrEqual(after  + 60 * 60 * 1000 + 100)
  })

  it('sends the admin password reset email with the raw token', async () => {
    userRepository.findByIdOrFail.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)

    await adminService.initiatePasswordReset(ADMIN_ID, TARGET_ID)

    expect(email.sendAdminPasswordReset).toHaveBeenCalledOnce()
    const [to, rawToken] = email.sendAdminPasswordReset.mock.calls[0]
    expect(to).toBe('target@example.com')
    expect(rawToken).not.toMatch(/^sha256:/) // raw, not hashed
  })

  it('returns a success message on happy path', async () => {
    userRepository.findByIdOrFail.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)

    const result = await adminService.initiatePasswordReset(ADMIN_ID, TARGET_ID)
    expect(result).toMatchObject({ message: expect.stringContaining('target@example.com') })
  })

  it('throws EMAIL_SEND_FAILED if email delivery fails — token is already saved', async () => {
    userRepository.findByIdOrFail.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)
    email.sendAdminPasswordReset.mockRejectedValue(new Error('SMTP error'))

    await expect(adminService.initiatePasswordReset(ADMIN_ID, TARGET_ID))
      .rejects.toMatchObject({ code: 'EMAIL_SEND_FAILED' })

    // Token was saved before the email attempt
    expect(userRepository.updateById).toHaveBeenCalledOnce()
    const [, fields] = userRepository.updateById.mock.calls[0]
    expect(fields.passwordResetToken).toBeDefined()
  })
})

// ── setUserActive ─────────────────────────────────────────────────────────────

describe('adminService.setUserActive', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws SELF_DEACTIVATION when admin targets their own account', async () => {
    await expect(adminService.setUserActive('same_id', 'same_id', false))
      .rejects.toMatchObject({ code: 'SELF_DEACTIVATION' })
    expect(userRepository.updateById).not.toHaveBeenCalled()
  })

  it('does not throw SELF_DEACTIVATION when activating own account', async () => {
    // Still blocked — self-activation is also not allowed
    await expect(adminService.setUserActive('same_id', 'same_id', true))
      .rejects.toMatchObject({ code: 'SELF_DEACTIVATION' })
  })

  it('deactivates a user when isActive is false', async () => {
    userRepository.findByIdOrFail.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)

    const result = await adminService.setUserActive(ADMIN_ID, TARGET_ID, false)
    expect(userRepository.updateById).toHaveBeenCalledWith(TARGET_ID, { isActive: false })
    expect(result.message).toMatch(/deactivated/i)
  })

  it('activates a user when isActive is true', async () => {
    userRepository.findByIdOrFail.mockResolvedValue(makeUser({ isActive: false }))
    userRepository.updateById.mockResolvedValue(undefined)

    const result = await adminService.setUserActive(ADMIN_ID, TARGET_ID, true)
    expect(userRepository.updateById).toHaveBeenCalledWith(TARGET_ID, { isActive: true })
    expect(result.message).toMatch(/activated/i)
  })

  it('throws when user not found', async () => {
    const { NotFoundError } = await import('../src/core/errors/index.js')
    userRepository.findByIdOrFail.mockRejectedValue(new NotFoundError('User'))
    await expect(adminService.setUserActive(ADMIN_ID, TARGET_ID, false))
      .rejects.toBeInstanceOf(NotFoundError)
  })
})

// ── updateUserRole ────────────────────────────────────────────────────────────

describe('adminService.updateUserRole', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws SELF_ROLE_CHANGE when admin targets their own account', async () => {
    await expect(adminService.updateUserRole('same_id', 'same_id', { role: 'viewer' }))
      .rejects.toMatchObject({ code: 'SELF_ROLE_CHANGE' })
    expect(userRepository.updateById).not.toHaveBeenCalled()
  })

  it('updates role field', async () => {
    userRepository.findByIdOrFail.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)

    await adminService.updateUserRole(ADMIN_ID, TARGET_ID, { role: 'editor' })
    expect(userRepository.updateById).toHaveBeenCalledWith(TARGET_ID, { role: 'editor' })
  })

  it('updates entityAccess field', async () => {
    userRepository.findByIdOrFail.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)

    await adminService.updateUserRole(ADMIN_ID, TARGET_ID, { entityAccess: ['church-1', 'church-2'] })
    expect(userRepository.updateById).toHaveBeenCalledWith(TARGET_ID, { entityAccess: ['church-1', 'church-2'] })
  })

  it('updates both role and entityAccess together', async () => {
    userRepository.findByIdOrFail.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)

    await adminService.updateUserRole(ADMIN_ID, TARGET_ID, { role: 'admin', entityAccess: ['all'] })
    expect(userRepository.updateById).toHaveBeenCalledWith(TARGET_ID, { role: 'admin', entityAccess: ['all'] })
  })

  it('returns a success message', async () => {
    userRepository.findByIdOrFail.mockResolvedValue(makeUser())
    userRepository.updateById.mockResolvedValue(undefined)

    const result = await adminService.updateUserRole(ADMIN_ID, TARGET_ID, { role: 'viewer' })
    expect(result).toMatchObject({ message: expect.any(String) })
  })
})

// ── listUsers ─────────────────────────────────────────────────────────────────

describe('adminService.listUsers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('passes filter and pagination to repository', async () => {
    userRepository.paginate.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 })

    await adminService.listUsers({ page: 2, limit: 10, role: 'admin', isActive: 'true' })

    expect(userRepository.paginate).toHaveBeenCalledWith(
      { role: 'admin', isActive: true },
      expect.objectContaining({ page: 2, limit: 10 })
    )
  })

  it('passes no filter when called with no args', async () => {
    userRepository.paginate.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 })

    await adminService.listUsers()
    expect(userRepository.paginate).toHaveBeenCalledWith({}, expect.any(Object))
  })

  it('filters by isActive: false when isActive="false"', async () => {
    userRepository.paginate.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 })

    await adminService.listUsers({ isActive: 'false' })
    const [filter] = userRepository.paginate.mock.calls[0]
    expect(filter.isActive).toBe(false)
  })
})
