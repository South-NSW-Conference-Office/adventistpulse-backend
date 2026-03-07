import { BaseRepository } from './base.repository.js'
import { TokenBlacklist } from '../models/TokenBlacklist.js'
import { TokenRevokedError } from '../core/errors/index.js'

class TokenBlacklistRepository extends BaseRepository {
  constructor() {
    super(TokenBlacklist)
  }

  async blacklist(jti, expiresAt, type = 'refresh') {
    return this.model.create({ jti, expiresAt, type })
  }

  async isBlacklisted(jti) {
    return this.model.exists({ jti })
  }

  /**
   * Atomically check-and-blacklist a refresh token JTI.
   * Uses unique index to prevent concurrent requests from both succeeding.
   * If the JTI already exists (duplicate key), it's already been used → revoked.
   */
  async atomicBlacklist(jti, expiresAt) {
    try {
      await this.model.create({ jti, expiresAt, type: 'refresh' })
    } catch (err) {
      if (err.code === 11000) throw new TokenRevokedError()
      throw err
    }
  }
}

export const tokenBlacklistRepository = new TokenBlacklistRepository()
