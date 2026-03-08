import { AppError } from '../core/errors/index.js'

/**
 * requireApproved — must be used AFTER authMiddleware + requireVerified.
 * Blocks dashboard and data API access until an admin has approved the account.
 *
 * Status → HTTP code + error code:
 *   pending_onboarding → 403 ONBOARDING_REQUIRED
 *   pending_approval   → 403 APPROVAL_PENDING
 *   rejected           → 403 ACCOUNT_REJECTED
 *   approved           → pass through
 */
export function requireApproved(req, res, next) {
  const status = req.user?.accountStatus ?? 'approved'

  switch (status) {
    case 'approved':
      return next()

    case 'pending_onboarding':
      return next(new AppError(
        'Please complete your profile before accessing this area.',
        { code: 'ONBOARDING_REQUIRED', statusCode: 403 }
      ))

    case 'pending_approval':
      return next(new AppError(
        'Your account is pending administrator approval.',
        { code: 'APPROVAL_PENDING', statusCode: 403 }
      ))

    case 'rejected':
      return next(new AppError(
        'Your account application was not approved. Please contact support.',
        { code: 'ACCOUNT_REJECTED', statusCode: 403 }
      ))

    default:
      return next(new AppError('Account status is invalid.', { code: 'INVALID_ACCOUNT_STATUS', statusCode: 403 }))
  }
}
