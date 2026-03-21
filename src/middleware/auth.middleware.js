import { tokenService } from '../services/token.service.js'
import { tokenBlacklistRepository } from '../repositories/tokenBlacklist.repository.js'
import { userRepository } from '../repositories/user.repository.js'
import { TokenInvalidError, TokenRevokedError, AppError } from '../core/errors/index.js'

export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) throw new TokenInvalidError()

    const token   = header.slice(7)
    const payload = await tokenService.verifyAccess(token)

    // Check access token JTI not blacklisted
    if (payload.jti) {
      const revoked = await tokenBlacklistRepository.isBlacklisted(payload.jti)
      if (revoked) throw new TokenRevokedError()
    }

    // Fetch fresh user — catches deleted, deactivated, role changes
    const user = await userRepository.findById(payload.sub)
    if (!user)          throw new TokenInvalidError()
    if (!user.isActive) throw new AppError('Account has been deactivated', { code: 'ACCOUNT_DEACTIVATED', statusCode: 403 })

    // Invalidate token if password was changed after it was issued
    // payload.iat is in seconds; passwordChangedAt is a Date
    if (user.passwordChangedAt) {
      const changedAt = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000)
      if (payload.iat < changedAt) throw new TokenInvalidError()
    }

    req.user = {
      sub:                user._id.toString(),
      _id:                user._id,  // ObjectId — needed by services that call User.findById(req.user._id)
      name:               user.name,
      email:              user.email,
      role:               user.role,
      entityAccess:       user.entityAccess,
      emailVerified:      user.emailVerified,
      mustChangePassword: !!user.mustChangePassword,
      accountStatus:      user.accountStatus ?? 'approved', // null-safe for existing users
      // subscription — needed for territory-scoped routes (admin/pastor/signal endpoints).
      // conferenceCode here is the source of truth; never trust conferenceCode from request params.
      subscription:       user.subscription ?? null,
    }

    // Silent token rotation — re-issue if expiring soon
    if (tokenService.isExpiringSoon(payload)) {
      const { jwt } = await import('../lib/jwt.js')
      const newToken = await jwt.issueAccessToken(req.user)
      res.setHeader('X-New-Access-Token', newToken)
    }

    next()
  } catch (err) {
    next(err)
  }
}
