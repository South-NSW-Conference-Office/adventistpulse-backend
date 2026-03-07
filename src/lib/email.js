import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { logger } from '../core/logger.js'

function createTransport() {
  if (!env.SMTP_HOST) {
    logger.warn('SMTP not configured — emails will not be sent')
    return null
  }
  return nodemailer.createTransport({
    host:   env.SMTP_HOST,
    port:   env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth:   { user: env.SMTP_USER, pass: env.SMTP_PASS },
  })
}

const transporter = createTransport()

async function send({ to, subject, html, text }) {
  if (!transporter) {
    logger.debug('Email skipped (SMTP not configured)', { to, subject })
    return
  }
  try {
    await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html, text })
    logger.debug('Email sent', { to, subject })
  } catch (err) {
    logger.error(`Failed to send email to ${to}`, err)
    throw err
  }
}

export const email = {
  async sendVerification(to, rawToken) {
    const url = `${env.FRONTEND_URL}/verify-email?token=${rawToken}`
    return send({
      to,
      subject: 'Verify your Adventist Pulse account',
      text: `Verify your email address by visiting this link (expires in 24 hours):\n\n${url}\n\nIf you did not create an account, ignore this email.`,
      html: `
        <p>Click the link below to verify your email address. This link expires in <strong>24 hours</strong>.</p>
        <p><a href="${url}">${url}</a></p>
        <p style="color:#999;font-size:12px;">If you did not create an Adventist Pulse account, you can safely ignore this email.</p>
      `,
    })
  },

  async sendPasswordReset(to, rawToken) {
    const url = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`
    return send({
      to,
      subject: 'Reset your Adventist Pulse password',
      text: `Reset your password by visiting this link (expires in 1 hour):\n\n${url}\n\nIf you did not request this, ignore this email — your password will not change.`,
      html: `
        <p>Click the link below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <p><a href="${url}">${url}</a></p>
        <p style="color:#999;font-size:12px;">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>
      `,
    })
  },

  // Sent after a successful password reset — security alert to account owner
  async sendPasswordChangedAlert(to, { changedAt }) {
    const formatted = new Date(changedAt).toLocaleString('en-AU', {
      timeZone: 'UTC',
      dateStyle: 'full',
      timeStyle: 'short',
    }) + ' UTC'
    return send({
      to,
      subject: 'Your Adventist Pulse password was changed',
      text: `Your password was successfully changed on ${formatted}.\n\nIf you made this change, no action is needed.\n\nIf you did NOT make this change, your account may be compromised. Contact your administrator immediately.`,
      html: `
        <p>Your <strong>Adventist Pulse</strong> password was successfully changed.</p>
        <p><strong>When:</strong> ${formatted}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
        <p>If you made this change, no action is needed.</p>
        <p style="color:#c0392b;"><strong>If you did NOT make this change</strong>, your account may be compromised. Contact your administrator immediately.</p>
      `,
    })
  },

  // Sent when a forgot-password is triggered for an OAuth-only account (no password set)
  async sendOAuthOnlyNotice(to) {
    return send({
      to,
      subject: 'Adventist Pulse — password reset not available',
      text: `You requested a password reset for this email address, but your Adventist Pulse account was created using Google sign-in and does not have a password.\n\nTo access your account, use the "Sign in with Google" option.\n\nIf you would like to add a password to your account, sign in with Google first, then add a password from your account settings.`,
      html: `
        <p>You requested a password reset for this email address.</p>
        <p>Your Adventist Pulse account was created using <strong>Google sign-in</strong> and does not have a password set.</p>
        <p>To access your account, use the <strong>"Sign in with Google"</strong> option on the login page.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
        <p style="color:#999;font-size:12px;">If you would like to add a password to your account, sign in with Google first, then add a password from your account settings.</p>
      `,
    })
  },

  // Sent when an admin triggers a password reset for a user
  async sendAdminPasswordReset(to, rawToken) {
    const url = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`
    return send({
      to,
      subject: 'Action required — reset your Adventist Pulse password',
      text: `An administrator has requested that you reset your Adventist Pulse password.\n\nClick the link below to set a new password. This link expires in 1 hour.\n\n${url}\n\nYou will be required to change your password the next time you sign in.`,
      html: `
        <p>An <strong>administrator</strong> has requested that you reset your <strong>Adventist Pulse</strong> password.</p>
        <p>Click the link below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <p><a href="${url}">${url}</a></p>
        <p>You will be required to change your password the next time you sign in.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
        <p style="color:#999;font-size:12px;">If you did not expect this email, contact your system administrator.</p>
      `,
    })
  },

  async sendEmailChange(to, rawToken) {
    const url = `${env.FRONTEND_URL}/confirm-email-change?token=${rawToken}`
    return send({
      to,
      subject: 'Confirm your new email address — Adventist Pulse',
      text: `Confirm your new email address by visiting this link (expires in 1 hour):\n\n${url}\n\nIf you did not request this change, ignore this email.`,
      html: `
        <p>Click the link below to confirm your new email address. This link expires in <strong>1 hour</strong>.</p>
        <p><a href="${url}">${url}</a></p>
        <p style="color:#999;font-size:12px;">If you did not request an email change, you can safely ignore this email.</p>
      `,
    })
  },
}
