import { BaseRepository } from './base.repository.js'
import { User } from '../models/User.js'

class UserRepository extends BaseRepository {
  constructor() {
    super(User)
  }

  async findByEmail(email) {
    return this.model.findOne({ email: email.toLowerCase() }).lean()
  }

  async findByEmailWithSensitiveFields(email) {
    return this.model
      .findOne({ email: email.toLowerCase() })
      .select('+password +loginAttempts +lockUntil')
      .lean()
  }

  async existsByEmail(email) {
    return this.model.exists({ email: email.toLowerCase() })
  }

  // Finds user by hashed verification token that hasn't expired
  async findByVerificationToken(hashedToken) {
    return this.model
      .findOne({
        emailVerificationToken:   hashedToken,
        emailVerificationExpires: { $gt: new Date() },
      })
      .select('+emailVerificationToken +emailVerificationExpires +verificationEmailSentAt')
      .lean()
  }

  // Finds user by hashed reset token that hasn't expired
  async findByResetToken(hashedToken) {
    return this.model
      .findOne({
        passwordResetToken:   hashedToken,
        passwordResetExpires: { $gt: new Date() },
      })
      .select('+passwordResetToken +passwordResetExpires +resetEmailSentAt')
      .lean()
  }

  // Finds user by hashed email change token that hasn't expired
  async findByEmailChangeToken(hashedToken) {
    return this.model
      .findOne({
        emailChangeToken:   hashedToken,
        emailChangeExpires: { $gt: new Date() },
      })
      .select('+pendingEmail +emailChangeToken +emailChangeExpires')
      .lean()
  }

  // For per-email rate limiting — returns resetEmailSentAt without other sensitive fields
  async findEmailRateLimitFields(email) {
    return this.model
      .findOne({ email: email.toLowerCase() })
      .select('+resetEmailSentAt +verificationEmailSentAt')
      .lean()
  }

  // For forgotPassword — needs isActive, password (OAuth check), and rate limit field
  async findForPasswordReset(email) {
    return this.model
      .findOne({ email: email.toLowerCase() })
      .select('+password +resetEmailSentAt')
      .lean()
  }

  async incrementLoginAttempts(userId, { lockUntil } = {}) {
    const update = { $inc: { loginAttempts: 1 } }
    if (lockUntil) update.$set = { lockUntil }
    return this.model.findByIdAndUpdate(userId, update, { new: true }).lean()
  }

  async resetLoginAttempts(userId) {
    return this.model.findByIdAndUpdate(
      userId,
      { $set: { loginAttempts: 0, lockUntil: null } },
      { new: true }
    ).lean()
  }

  async linkOAuthProvider(userId, { provider, providerAccountId }) {
    return this.model.findByIdAndUpdate(
      userId,
      { $push: { oauthProviders: { provider, providerAccountId } } },
      { new: true }
    ).lean()
  }
}

export const userRepository = new UserRepository()
