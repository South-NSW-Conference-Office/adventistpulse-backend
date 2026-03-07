import { randomBytes } from 'crypto'
import { userRepository } from '../repositories/user.repository.js'
import { crypto } from '../lib/crypto.js'
import { email } from '../lib/email.js'
import { logger } from '../core/logger.js'
import { AppError } from '../core/errors/index.js'

class AdminService {
  /**
   * Force-send a password reset email to any user — bypasses the per-email rate limit.
   * Admin use only. Does not expose any token to the admin.
   */
  async initiatePasswordReset(adminId, targetUserId) {
    const target = await userRepository.findByIdOrFail(targetUserId, 'User')

    if (!target.isActive) {
      throw new AppError('Cannot reset password for a deactivated account', {
        code: 'ACCOUNT_DEACTIVATED',
        statusCode: 400,
      })
    }

    if (!target.password && target.oauthProviders?.length > 0) {
      throw new AppError(
        'This account uses Google sign-in and has no password. The user must add a password from their account settings after signing in with Google.',
        { code: 'OAUTH_ONLY', statusCode: 400 }
      )
    }

    const rawToken    = randomBytes(32).toString('hex')
    const hashedToken = crypto.hashToken(rawToken)

    // Bypass rate limit — admin override
    await userRepository.updateById(target._id, {
      passwordResetToken:   hashedToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      mustChangePassword:   true,   // force change on next login
      resetEmailSentAt:     null,   // clear so user can self-serve again after if needed
    })

    try {
      await email.sendAdminPasswordReset(target.email, rawToken, { adminId })
      logger.debug('Admin-initiated password reset sent', { targetUserId, adminId })
    } catch (err) {
      logger.error('Admin password reset email failed', { targetUserId, err })
      throw new AppError('Failed to send reset email. Token is saved — try again.', {
        code: 'EMAIL_SEND_FAILED',
        statusCode: 502,
      })
    }

    return { message: `Password reset email sent to ${target.email}` }
  }

  /**
   * List all users (paginated) — admin only
   */
  async listUsers({ page = 1, limit = 20, role, isActive } = {}) {
    const filter = {}
    if (role)            filter.role     = role
    if (isActive != null) filter.isActive = isActive === 'true' || isActive === true

    return userRepository.paginate(filter, { page, limit, sort: { createdAt: -1 } })
  }

  /**
   * Toggle a user's active state
   */
  async setUserActive(adminId, targetUserId, isActive) {
    if (adminId === targetUserId) {
      throw new AppError('Admins cannot deactivate their own account', {
        code: 'SELF_DEACTIVATION',
        statusCode: 400,
      })
    }
    await userRepository.findByIdOrFail(targetUserId, 'User')
    await userRepository.updateById(targetUserId, { isActive })
    logger.debug(`Admin ${isActive ? 'activated' : 'deactivated'} user`, { targetUserId, adminId })
    return { message: `User ${isActive ? 'activated' : 'deactivated'}` }
  }

  /**
   * Update a user's role and/or entityAccess
   */
  async updateUserRole(adminId, targetUserId, { role, entityAccess }) {
    if (adminId === targetUserId) {
      throw new AppError('Admins cannot change their own role', {
        code: 'SELF_ROLE_CHANGE',
        statusCode: 400,
      })
    }
    await userRepository.findByIdOrFail(targetUserId, 'User')
    const update = {}
    if (role)          update.role          = role
    if (entityAccess)  update.entityAccess  = entityAccess

    await userRepository.updateById(targetUserId, update)
    logger.debug('Admin updated user role', { targetUserId, adminId, update })
    return { message: 'User updated' }
  }
}

export const adminService = new AdminService()
