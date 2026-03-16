import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────────────────────────────
vi.mock('../src/repositories/onboarding.repository.js', () => ({
  onboardingRepository: {
    findByUserId:    vi.fn(),
    upsertByUserId:  vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('../src/repositories/user.repository.js', () => ({
  userRepository: {
    findByIdOrFail: vi.fn(),
    updateById:     vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('../src/lib/email.js', () => ({
  email: {
    sendOnboardingSubmitted: vi.fn().mockResolvedValue(undefined),
    sendApplicationReceived: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('../src/config/env.js', () => ({
  env: { ADMIN_DASHBOARD_URL: 'https://example.com/admin' },
}))

// ── Imports (after mocks) ────────────────────────────────────────────────────
const { onboardingService }     = await import('../src/services/onboarding.service.js')
const { onboardingRepository }  = await import('../src/repositories/onboarding.repository.js')
const { userRepository }        = await import('../src/repositories/user.repository.js')

// ── Tests ────────────────────────────────────────────────────────────────────

describe('OnboardingService', () => {
  beforeEach(() => { vi.clearAllMocks() })

  const userId = 'user-id-123'

  describe('getStatus', () => {
    it('returns status and profile when user is approved', async () => {
      userRepository.findByIdOrFail.mockResolvedValue({
        accountStatus: 'approved',
        rejectionReason: null,
      })
      onboardingRepository.findByUserId.mockResolvedValue({ church: 'Test Church' })

      const result = await onboardingService.getStatus(userId)
      expect(result.accountStatus).toBe('approved')
      expect(result.rejectionReason).toBeNull()
      expect(result.profile).toEqual({ church: 'Test Church' })
    })

    it('returns rejectionReason from user directly when status is rejected', async () => {
      userRepository.findByIdOrFail.mockResolvedValue({
        accountStatus: 'rejected',
        rejectionReason: 'Insufficient credentials',
      })
      onboardingRepository.findByUserId.mockResolvedValue(null)

      const result = await onboardingService.getStatus(userId)
      expect(result.rejectionReason).toBe('Insufficient credentials')
      // Should NOT make a second DB call to fetch rejection reason
      expect(userRepository.findByIdOrFail).toHaveBeenCalledTimes(1)
    })

    it('returns null profile when no profile exists', async () => {
      userRepository.findByIdOrFail.mockResolvedValue({ accountStatus: 'pending_onboarding' })
      onboardingRepository.findByUserId.mockResolvedValue(null)

      const result = await onboardingService.getStatus(userId)
      expect(result.profile).toBeNull()
    })

    it('defaults accountStatus to "approved" when field is missing', async () => {
      userRepository.findByIdOrFail.mockResolvedValue({}) // no accountStatus
      onboardingRepository.findByUserId.mockResolvedValue(null)

      const result = await onboardingService.getStatus(userId)
      expect(result.accountStatus).toBe('approved')
    })
  })

  describe('submit', () => {
    const profileData = { church: 'Hills Adventist', role: 'elder' }

    it('advances status to pending_approval for pending_onboarding users', async () => {
      userRepository.findByIdOrFail.mockResolvedValue({
        _id: userId,
        accountStatus: 'pending_onboarding',
        name: 'Test User',
        email: 'test@example.com',
      })

      const result = await onboardingService.submit(userId, profileData)
      expect(result.accountStatus).toBe('pending_approval')
      expect(userRepository.updateById).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ accountStatus: 'pending_approval' }),
      )
      expect(onboardingRepository.upsertByUserId).toHaveBeenCalledWith(userId, profileData)
    })

    it('allows re-submission after rejection', async () => {
      userRepository.findByIdOrFail.mockResolvedValue({
        _id: userId,
        accountStatus: 'rejected',
        name: 'Test User',
        email: 'test@example.com',
      })

      const result = await onboardingService.submit(userId, profileData)
      expect(result.accountStatus).toBe('pending_approval')
    })

    it('throws when already pending_approval', async () => {
      userRepository.findByIdOrFail.mockResolvedValue({
        _id: userId,
        accountStatus: 'pending_approval',
      })
      await expect(onboardingService.submit(userId, profileData)).rejects.toThrow('already under review')
    })

    it('throws when already approved', async () => {
      userRepository.findByIdOrFail.mockResolvedValue({
        _id: userId,
        accountStatus: 'approved',
      })
      await expect(onboardingService.submit(userId, profileData)).rejects.toThrow('already approved')
    })
  })
})
