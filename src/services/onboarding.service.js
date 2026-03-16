import { onboardingRepository } from '../repositories/onboarding.repository.js'
import { userRepository }        from '../repositories/user.repository.js'
import { email }                 from '../lib/email.js'
import { AppError }              from '../core/errors/index.js'
import { env }                   from '../config/env.js'

class OnboardingService {
  /**
   * Get the current user's accountStatus + their profile data (if submitted).
   */
  async getStatus(userId) {
    const user    = await userRepository.findByIdOrFail(userId, 'User')
    const profile = await onboardingRepository.findByUserId(userId)
    return {
      accountStatus:   user.accountStatus ?? 'approved',
      rejectionReason: user.accountStatus === 'rejected' ? user.rejectionReason ?? null : null,
      profile:         profile ?? null,
    }
  }

  /**
   * Submit (or re-submit after rejection) the onboarding form.
   * Sets accountStatus → 'pending_approval' and notifies admins.
   */
  async submit(userId, data) {
    const user = await userRepository.findByIdOrFail(userId, 'User')

    const allowed = ['pending_onboarding', 'rejected']
    if (!allowed.includes(user.accountStatus)) {
      throw new AppError(
        user.accountStatus === 'pending_approval'
          ? 'Your application is already under review.'
          : 'Your account is already approved.',
        { code: 'INVALID_STATUS_TRANSITION', statusCode: 400 }
      )
    }

    // Upsert profile
    await onboardingRepository.upsertByUserId(userId, data)

    // Advance status
    await userRepository.updateById(userId, {
      accountStatus:   'pending_approval',
      rejectionReason: null,
      rejectedAt:      null,
      rejectedBy:      null,
    })

    // Notify admins (fire-and-forget)
    email.sendOnboardingSubmitted({ userName: user.name, userEmail: user.email })
      .catch(() => {})

    // Confirm receipt to user
    email.sendApplicationReceived(user.email, user.name).catch(() => {})

    return { accountStatus: 'pending_approval' }
  }
}

export const onboardingService = new OnboardingService()
