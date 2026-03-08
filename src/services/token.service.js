import { jwt } from '../lib/jwt.js'
import { env } from '../config/env.js'
import { tokenBlacklistRepository } from '../repositories/tokenBlacklist.repository.js'
import { TokenRevokedError, TokenInvalidError, RefreshTokenMissingError } from '../core/errors/index.js'

class TokenService {
  buildAccessPayload(user) {
    return {
      sub:          user._id.toString(),
      name:         user.name,
      email:        user.email,
      role:         user.role,
      entityAccess: user.entityAccess ?? [],
    }
  }

  buildRefreshPayload(user) {
    return { sub: user._id.toString() }
  }

  async issueTokenPair(user, { rememberMe = false } = {}) {
    const refreshExpiry = rememberMe
      ? env.JWT_REMEMBER_ME_EXPIRY_SECONDS
      : env.JWT_REFRESH_EXPIRY_SECONDS

    const [accessToken, refreshToken] = await Promise.all([
      jwt.issueAccessToken(this.buildAccessPayload(user)),
      jwt.issueRefreshToken(this.buildRefreshPayload(user), refreshExpiry),
    ])
    return { accessToken, refreshToken, refreshExpiry }
  }

  async verifyAccess(token) {
    return jwt.verifyAccessToken(token)
  }

  /**
   * Verify + atomically blacklist the refresh token.
   * Atomic insert prevents concurrent refresh race condition —
   * if two requests race, the second gets a duplicate key error → TokenRevokedError.
   */
  async verifyAndRotateRefresh(refreshToken) {
    if (!refreshToken) throw new RefreshTokenMissingError()

    const payload = await jwt.verifyRefreshToken(refreshToken)
    if (!payload.jti) throw new TokenInvalidError()

    // Atomic blacklist — throws TokenRevokedError if JTI already used
    await tokenBlacklistRepository.atomicBlacklist(
      payload.jti,
      new Date(payload.exp * 1000)
    )

    return payload
  }

  /**
   * Revoke both access and refresh tokens on logout.
   */
  async revokeTokens(accessToken, refreshToken) {
    const revocations = []

    if (refreshToken) {
      revocations.push(
        jwt.verifyRefreshToken(refreshToken)
          .then(p => p?.jti
            ? tokenBlacklistRepository.blacklist(p.jti, new Date(p.exp * 1000), 'refresh')
            : null
          )
          .catch(() => {}) // already invalid — ignore
      )
    }

    if (accessToken) {
      revocations.push(
        jwt.verifyAccessToken(accessToken)
          .then(p => p?.jti
            ? tokenBlacklistRepository.blacklist(p.jti, new Date(p.exp * 1000), 'access')
            : null
          )
          .catch(() => {}) // already expired — ignore
      )
    }

    await Promise.all(revocations)
  }

  isExpiringSoon(payload) {
    return jwt.isExpiringSoon(payload)
  }

  /**
   * Cookie maxAge is derived from the same expiry used to sign the JWT —
   * both stay in sync so the cookie never outlives (or underlives) the token.
   * @param {number} refreshExpirySecs - must match the JWT refresh expiry used in issueTokenPair
   */
  getRefreshCookieOptions(refreshExpirySecs = env.JWT_REFRESH_EXPIRY_SECONDS) {
    const isProd = env.NODE_ENV === 'production'
    return {
      httpOnly: true,
      secure:   isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge:   refreshExpirySecs * 1000, // cookie and JWT expiry always identical
      path:     '/api',
    }
  }
}

export const tokenService = new TokenService()
