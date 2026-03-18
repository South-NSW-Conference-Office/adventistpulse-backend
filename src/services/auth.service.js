import { randomBytes } from 'crypto'
import { logger } from '../core/logger.js'
import { userRepository } from '../repositories/user.repository.js'
import { tokenService } from './token.service.js'
import { crypto } from '../lib/crypto.js'
import { email } from '../lib/email.js'
import {
  User,
  MAX_LOGIN_ATTEMPTS,
  LOCK_DURATION_MS,
  RESET_EMAIL_COOLDOWN_MS,
  RESEND_VERIFY_COOLDOWN_MS,
} from '../models/User.js'
import { BetaSignup } from '../models/BetaSignup.js'
import { createHmac } from 'crypto'
import { env } from '../config/env.js'
import {
  InvalidCredentialsError,
  EmailTakenError,
  RefreshTokenMissingError,
  EmailNotVerifiedError,
  ResendCooldownError,
  ResetRateLimitError,
  AppError,
} from '../core/errors/index.js'

// Minimum response time for forgot-password — prevents timing-based email enumeration
const MIN_FORGOT_PASSWORD_MS = 600

class AuthService {
  async register({ name, email: emailAddr, password }) {
    const exists = await userRepository.existsByEmail(emailAddr)
    if (exists) throw new EmailTakenError()

    const rawToken = await this.#generateToken()
    const hashedToken = crypto.hashToken(rawToken)

    const [hashedPassword] = await Promise.all([crypto.hash(password)])

    const user = await userRepository.create({
      name,
      email: emailAddr,
      password: hashedPassword,
      emailVerificationToken:   hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      verificationEmailSentAt:  new Date(),
    })

    // Non-blocking — don't fail registration if email fails
    email.sendVerification(user.email, rawToken).catch(() => {})

    const tokens = await tokenService.issueTokenPair(user)
    return { tokens, user: this.#safeUser(user), isNewUser: true }
  }

  async login({ email: emailAddr, password, rememberMe = false }) {
    const user = await userRepository.findByEmailWithSensitiveFields(emailAddr)

    // Dummy compare prevents timing attack when user not found
    if (!user) {
      await crypto.compare(password, '$2b$12$invalidhashpaddinginvalidhashpaddinginvalidhashpaddi')
      throw new InvalidCredentialsError()
    }

    if (!user.isActive) {
      throw new AppError('This account has been deactivated', { code: 'ACCOUNT_DEACTIVATED', statusCode: 403 })
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000)
      throw new AppError(
        `Account locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
        { code: 'ACCOUNT_LOCKED', statusCode: 429 }
      )
    }

    if (!user.password) throw new InvalidCredentialsError()

    const valid = await crypto.compare(password, user.password)
    if (!valid) {
      await this.#handleFailedAttempt(user)
      throw new InvalidCredentialsError()
    }

    if (user.loginAttempts > 0) await userRepository.resetLoginAttempts(user._id)

    const tokens = await tokenService.issueTokenPair(user, { rememberMe })
    return {
      tokens,
      user:               this.#safeUser(user),
      isNewUser:          false,
      mustChangePassword: !!user.mustChangePassword,
    }
  }

  async refresh(refreshToken) {
    if (!refreshToken) throw new RefreshTokenMissingError()
    const payload = await tokenService.verifyAndRotateRefresh(refreshToken)
    const user = await userRepository.findByIdOrFail(payload.sub, 'User')

    if (!user.isActive) {
      throw new AppError('Account has been deactivated', { code: 'ACCOUNT_DEACTIVATED', statusCode: 403 })
    }

    const tokens = await tokenService.issueTokenPair(user)
    return { tokens }
  }

  async logout(accessToken, refreshToken) {
    await tokenService.revokeTokens(accessToken, refreshToken)
  }

  async me(userId) {
    return userRepository.findByIdOrFail(userId, 'User').then(u => this.#safeUser(u))
  }

  async verifyEmail(rawToken) {
    const hashedToken = crypto.hashToken(rawToken)
    const user = await userRepository.findByVerificationToken(hashedToken)
    if (!user) throw new AppError('Invalid or expired verification link', { code: 'INVALID_TOKEN', statusCode: 400 })

    await userRepository.updateById(user._id, {
      emailVerified:            true,
      emailVerificationToken:   null,
      emailVerificationExpires: null,
      verificationEmailSentAt:  null,
      accountStatus:            'pending_onboarding', // explicit — triggers onboarding flow
    })
  }

  async resendVerification(userId) {
    const user = await userRepository.findEmailRateLimitFieldsById(userId)
    if (!user) throw new AppError('User not found', { code: 'NOT_FOUND', statusCode: 404 })

    if (user.emailVerified) {
      throw new AppError('Email is already verified', { code: 'ALREADY_VERIFIED', statusCode: 400 })
    }

    // Resend cooldown — prevent spam
    if (user.verificationEmailSentAt) {
      const elapsed = Date.now() - new Date(user.verificationEmailSentAt).getTime()
      const remaining = Math.ceil((RESEND_VERIFY_COOLDOWN_MS - elapsed) / 1000)
      if (elapsed < RESEND_VERIFY_COOLDOWN_MS) throw new ResendCooldownError(remaining)
    }

    const rawToken    = await this.#generateToken()
    const hashedToken = crypto.hashToken(rawToken)

    await userRepository.updateById(userId, {
      emailVerificationToken:   hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      verificationEmailSentAt:  new Date(),
    })

    const fullUser = await userRepository.findByIdOrFail(userId, 'User')
    email.sendVerification(fullUser.email, rawToken).catch(() => {})
  }

  /**
   * Public resend — no auth required. Accepts email address only.
   * Timing-safe: always takes the same code path regardless of whether the
   * email exists or is already verified, so we never reveal account existence.
   */
  async resendVerificationByEmail(emailAddr) {
    const start = Date.now()

    try {
      const user = await userRepository.findEmailRateLimitFields(emailAddr)

      // Silently skip if no account or already verified — don't reveal status
      if (!user || user.emailVerified) return

      if (user.verificationEmailSentAt) {
        const elapsed = Date.now() - new Date(user.verificationEmailSentAt).getTime()
        const remaining = Math.ceil((RESEND_VERIFY_COOLDOWN_MS - elapsed) / 1000)
        if (elapsed < RESEND_VERIFY_COOLDOWN_MS) throw new ResendCooldownError(remaining)
      }

      const rawToken    = await this.#generateToken()
      const hashedToken = crypto.hashToken(rawToken)

      await userRepository.updateById(user._id, {
        emailVerificationToken:   hashedToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        verificationEmailSentAt:  new Date(),
      })

      email.sendVerification(emailAddr, rawToken).catch(() => {})
    } finally {
      // Constant-time padding — minimum 200ms so timing doesn't reveal account existence
      const elapsed = Date.now() - start
      if (elapsed < 200) await new Promise(r => setTimeout(r, 200 - elapsed))
    }
  }

  async forgotPassword(emailAddr) {
    const start = Date.now()

    // Need password + isActive + rate limit fields
    const user = await userRepository.findForPasswordReset(emailAddr)

    if (user) {
      // 1. Deactivated accounts — skip silently (no email, no token saved)
      if (!user.isActive) {
        await this.#padResponse(start)
        return
      }

      // 2. OAuth-only account (no password set) — send a helpful notice instead
      if (!user.password) {
        email.sendOAuthOnlyNotice(user.email).catch(() => {})
        await this.#padResponse(start)
        return
      }

      // 3. Per-email rate limit — max 1 reset per hour regardless of IP
      if (user.resetEmailSentAt) {
        const elapsed = Date.now() - new Date(user.resetEmailSentAt).getTime()
        if (elapsed < RESET_EMAIL_COOLDOWN_MS) {
          await this.#padResponse(start)
          throw new ResetRateLimitError()
        }
      }

      const rawToken    = await this.#generateToken()
      const hashedToken = crypto.hashToken(rawToken)

      // 4. Write token to DB first (not resetEmailSentAt yet)
      await userRepository.updateById(user._id, {
        passwordResetToken:   hashedToken,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      })

      // 5. Send email — only record resetEmailSentAt on successful delivery
      //    If email fails, user can retry immediately (no phantom rate limit)
      try {
        await email.sendPasswordReset(user.email, rawToken)
        await userRepository.updateById(user._id, { resetEmailSentAt: new Date() })
      } catch {
        // Email failed — token is saved but rate limit NOT applied so user can retry
        logger.error('Password reset email delivery failed', { email: user.email })
      }
    }

    // Always pad — prevents timing-based email enumeration
    await this.#padResponse(start)
  }

  async resetPassword(rawToken, newPassword) {
    const hashedToken = crypto.hashToken(rawToken)
    const user = await userRepository.findByResetToken(hashedToken)
    if (!user) throw new AppError('Invalid or expired reset link', { code: 'INVALID_TOKEN', statusCode: 400 })

    const hashed     = await crypto.hash(newPassword)
    const changedAt  = new Date()

    await userRepository.updateById(user._id, {
      password:             hashed,
      passwordResetToken:   null,
      passwordResetExpires: null,
      // 6. Keep resetEmailSentAt — creates cooldown preventing immediate re-request
      loginAttempts:        0,
      lockUntil:            null,
      mustChangePassword:   false,
      passwordChangedAt:    changedAt,
    })

    // Send security alert to account owner (non-blocking — don't fail the reset)
    email.sendPasswordChangedAlert(user.email, { changedAt }).catch(() => {})
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findByIdWithSensitiveFields(userId)
    if (!user) throw new AppError('User not found', { code: 'NOT_FOUND', statusCode: 404 })
    if (!user.password) throw new AppError('Cannot change password on OAuth-only accounts', { code: 'OAUTH_ONLY', statusCode: 400 })

    // Verify current password
    const valid = await crypto.compare(currentPassword, user.password)
    if (!valid) throw new AppError('Current password is incorrect', { code: 'WRONG_PASSWORD', statusCode: 400 })

    // Hash and save new password
    const hashed = await crypto.hash(newPassword)
    const changedAt = new Date()

    await userRepository.updateById(userId, {
      password:           hashed,
      mustChangePassword: false,
      passwordChangedAt:  changedAt,
    })

    // Send security alert (non-blocking)
    email.sendPasswordChangedAlert(user.email, { changedAt }).catch(() => {})
  }

  async changeEmail(userId, newEmail, password) {
    // Verify password before allowing email change — single query by id
    const user = await userRepository.findByIdWithSensitiveFields(userId)
    if (!user) throw new AppError('User not found', { code: 'NOT_FOUND', statusCode: 404 })
    if (!user.password) throw new AppError('Cannot change email on OAuth-only accounts', { code: 'OAUTH_ONLY', statusCode: 400 })

    const valid = await crypto.compare(password, user.password)
    if (!valid) throw new InvalidCredentialsError()

    // Check new email not already taken
    const taken = await userRepository.existsByEmail(newEmail)
    if (taken) throw new EmailTakenError()

    const rawToken    = await this.#generateToken()
    const hashedToken = crypto.hashToken(rawToken)

    await userRepository.updateById(userId, {
      pendingEmail:       newEmail.toLowerCase(),
      emailChangeToken:   hashedToken,
      emailChangeExpires: new Date(Date.now() + 60 * 60 * 1000),
    })

    email.sendEmailChange(newEmail, rawToken).catch(() => {})
  }

  async confirmEmailChange(rawToken) {
    const hashedToken = crypto.hashToken(rawToken)
    const user = await userRepository.findByEmailChangeToken(hashedToken)
    if (!user || !user.pendingEmail) throw new AppError('Invalid or expired email change link', { code: 'INVALID_TOKEN', statusCode: 400 })

    // Double-check the pending email isn't taken by now
    const taken = await userRepository.existsByEmail(user.pendingEmail)
    if (taken) throw new EmailTakenError()

    await userRepository.updateById(user._id, {
      email:              user.pendingEmail,
      pendingEmail:       null,
      emailChangeToken:   null,
      emailChangeExpires: null,
      emailVerified:      true,       // new email is verified by clicking the link
      passwordChangedAt:  new Date(), // invalidate all existing sessions
    })
  }

  async betaSignup({ firstName, lastName, email: emailAddr, church, conference, role, pastorEmail }) {
    if (!emailAddr || !firstName || !church || !role) {
      throw new AppError('Missing required fields: firstName, email, church, role', { code: 'VALIDATION_ERROR', statusCode: 400 })
    }

    // Upsert signup record
    const signup = await BetaSignup.findOneAndUpdate(
      { email: emailAddr.toLowerCase() },
      { firstName, lastName, email: emailAddr.toLowerCase(), church, conference, role, pastorEmail },
      { upsert: true, new: true, runValidators: true }
    ).lean()

    // Create/update Brevo contact
    await email.sendBrevoContact({ email: emailAddr, firstName, lastName, church, conference, role, pastorEmail })

    // Notify admin
    const dashUrl = env.ADMIN_DASHBOARD_URL ?? 'https://adventistpulse.org/admin'
    await email.sendAdminNotification({
      to: 'pulse@adventist.org.au',
      subject: `New beta request — ${firstName} ${lastName ?? ''} (${church})`,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:600px;padding:24px">
          <h3 style="color:#14b8a6">New Pulse Beta Request</h3>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr><td style="padding:8px;color:#888;width:140px">Name</td><td style="padding:8px;font-weight:600">${firstName} ${lastName ?? ''}</td></tr>
            <tr style="background:#f8f9fa"><td style="padding:8px;color:#888">Email</td><td style="padding:8px">${emailAddr}</td></tr>
            <tr><td style="padding:8px;color:#888">Church</td><td style="padding:8px">${church}</td></tr>
            <tr style="background:#f8f9fa"><td style="padding:8px;color:#888">Conference</td><td style="padding:8px">${conference ?? ''}</td></tr>
            <tr><td style="padding:8px;color:#888">Role</td><td style="padding:8px">${role}</td></tr>
            ${pastorEmail ? `<tr style="background:#f8f9fa"><td style="padding:8px;color:#888">Pastor email</td><td style="padding:8px">${pastorEmail}</td></tr>` : ''}
          </table>
          <p style="margin-top:24px">
            <a href="${dashUrl}" style="background:#14b8a6;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">
              Open Approval Dashboard →
            </a>
          </p>
        </div>
      `,
    })

    // Send pastor confirmation if provided
    if (pastorEmail) {
      const token = this.#signPastorToken(emailAddr)
      await email.sendPastorConfirmation({ to: pastorEmail, firstName, lastName, church, token })
    }

    return { ok: true }
  }

  async confirmPastor({ token, decision }) {
    const emailAddr = this.#verifyPastorToken(token)
    if (!emailAddr) {
      throw new AppError('Invalid or expired token', { code: 'INVALID_TOKEN', statusCode: 400 })
    }

    const confirmed = decision === 'yes'
    await BetaSignup.findOneAndUpdate(
      { email: emailAddr.toLowerCase() },
      { pastorConfirmed: confirmed }
    )

    return { email: emailAddr, confirmed }
  }

  #signPastorToken(emailAddr) {
    const payload = `${emailAddr}:${Date.now()}`
    const hmac = createHmac('sha256', env.JWT_SECRET.split(',')[0]).update(payload).digest('hex')
    return `${Buffer.from(payload).toString('base64url')}.${hmac}`
  }

  #verifyPastorToken(token) {
    if (!token || !token.includes('.')) return null
    const [payloadB64, sig] = token.split('.')
    const payload = Buffer.from(payloadB64, 'base64url').toString()
    const expectedSig = createHmac('sha256', env.JWT_SECRET.split(',')[0]).update(payload).digest('hex')
    if (sig !== expectedSig) return null

    const [emailAddr, ts] = payload.split(':')
    // Token valid for 7 days
    if (Date.now() - Number(ts) > 7 * 24 * 60 * 60 * 1000) return null
    return emailAddr
  }

  async #handleFailedAttempt(user) {
    const attempts    = (user.loginAttempts ?? 0) + 1
    const shouldLock  = attempts >= MAX_LOGIN_ATTEMPTS
    await userRepository.incrementLoginAttempts(user._id, {
      lockUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : undefined,
    })
  }

  // Ensure response takes at least `minMs` — prevents timing-based enumeration
  async #padResponse(startTime, minMs = MIN_FORGOT_PASSWORD_MS) {
    const elapsed = Date.now() - startTime
    if (elapsed < minMs) await new Promise(r => setTimeout(r, minMs - elapsed))
  }

  async #generateToken() {
    return randomBytes(32).toString('hex')
  }

  #safeUser(user) {
    const {
      password, loginAttempts, lockUntil,
      emailVerificationToken, emailVerificationExpires, verificationEmailSentAt,
      passwordResetToken, passwordResetExpires, resetEmailSentAt,
      pendingEmail, emailChangeToken, emailChangeExpires,
      oauthProviders, __v,
      ...safe
    } = user
    // Normalise accountStatus for users created before this field existed
    safe.accountStatus = safe.accountStatus ?? 'approved'
    return safe
  }
}

export const authService = new AuthService()
