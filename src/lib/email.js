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

// ─── Shared layout wrapper ────────────────────────────────────────────────────

function layout(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Adventist Pulse</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:580px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888888;">
                ADVENTIST PULSE
              </p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border:1px solid #e0e0e0;padding:40px 44px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#aaaaaa;line-height:1.6;">
                This email was sent by Adventist Pulse. Please do not reply to this message —
                it was sent from an unmonitored address.
              </p>
              <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#aaaaaa;">
                &copy; ${new Date().getFullYear()} Adventist Pulse. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ─── Shared prose styles ──────────────────────────────────────────────────────

const H1  = 'margin:0 0 8px;font-family:Georgia,"Times New Roman",serif;font-size:22px;font-weight:normal;color:#111111;line-height:1.3;'
const P   = 'margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333333;line-height:1.7;'
const SM  = 'margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#888888;line-height:1.6;'
const HR  = '<tr><td style="padding:8px 0 24px;"><hr style="border:none;border-top:1px solid #e8e8e8;margin:0;" /></td></tr>'
const LBL = 'font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888888;display:block;margin-bottom:4px;'
const URL_STYLE = 'font-family:"Courier New",Courier,monospace;font-size:12px;color:#111111;word-break:break-all;'

// ─── Email templates ──────────────────────────────────────────────────────────

// ─── Brevo HTTP helpers ────────────────────────────────────────────────────

async function brevoFetch(path, body) {
  const key = env.BREVO_API_KEY
  if (!key) {
    logger.debug('Brevo skipped (BREVO_API_KEY not configured)', { path })
    return null
  }
  const res = await fetch(`https://api.brevo.com/v3${path}`, {
    method: 'POST',
    headers: { 'api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok && res.status !== 204) {
    const text = await res.text()
    logger.error(`Brevo API error: ${path}`, { status: res.status, body: text })
  }
  return res
}

export const email = {

  async sendBrevoContact({ email: contactEmail, firstName, lastName, church, conference, role, pastorEmail }) {
    return brevoFetch('/contacts', {
      email: contactEmail,
      attributes: {
        FIRSTNAME: firstName,
        LASTNAME: lastName ?? '',
        CHURCH: church,
        CONFERENCE: conference ?? '',
        ROLE: role,
        PASTOR_EMAIL: pastorEmail ?? '',
        APPROVAL_STATUS: 'pending',
      },
      listIds: [4],
      updateEnabled: true,
    })
  },

  async sendAdminNotification({ to, subject, htmlContent }) {
    return brevoFetch('/smtp/email', {
      to: [{ email: to }],
      sender: { name: 'Adventist Pulse Signups', email: 'pulse@adventist.org.au' },
      subject,
      htmlContent,
    })
  },

  async sendPastorConfirmation({ to, firstName, lastName, church, token }) {
    const dashUrl = env.ADMIN_DASHBOARD_URL ?? 'https://adventistpulse.org'
    const yesUrl = `${env.FRONTEND_URL}/api/auth/pastor-confirm?token=${encodeURIComponent(token)}&decision=yes`
    const noUrl = `${env.FRONTEND_URL}/api/auth/pastor-confirm?token=${encodeURIComponent(token)}&decision=no`
    return brevoFetch('/smtp/email', {
      to: [{ email: to }],
      sender: { name: 'Adventist Pulse', email: 'pulse@adventist.org.au' },
      subject: `Quick question about ${firstName} ${lastName ?? ''} — Adventist Pulse`,
      htmlContent: `
        <div style="font-family:sans-serif;max-width:600px;padding:32px">
          <p>Hello,</p>
          <p><strong>${firstName} ${lastName ?? ''}</strong> has requested beta access to Adventist Pulse, listing their church as <strong>${church}</strong>.</p>
          <p style="margin-top:16px">As their pastor, please confirm:</p>
          <p style="font-size:18px;font-weight:600;color:#1a1a1a;margin:16px 0">Is ${firstName} a member in good and regular standing at ${church}?</p>
          <div style="margin:24px 0">
            <a href="${yesUrl}" style="background:#10b981;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;margin-right:12px">
              ✓ Yes, confirm membership
            </a>
            <a href="${noUrl}" style="background:#ef4444;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
              ✗ Not at this time
            </a>
          </div>
          <p style="color:#888;font-size:12px">This single click is all that's needed. You will not be asked again for this person.<br>Adventist Pulse · pulse@adventist.org.au</p>
        </div>
      `,
    })
  },


  async sendVerification(to, rawToken) {
    const url = `${env.FRONTEND_URL}/verify-email?token=${rawToken}`
    const body = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:28px;">
          <h1 style="${H1}">Verify your email address</h1>
          <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#888888;">
            One step to activate your Adventist Pulse account
          </p>
        </td></tr>

        ${HR}

        <tr><td>
          <p style="${P}">
            Thank you for creating an account with Adventist Pulse. To complete your registration
            and activate your account, please verify your email address by following the link below.
          </p>
          <p style="${P}">
            This verification link will expire in <strong>24 hours</strong>. If it expires,
            you can request a new one from your account page.
          </p>
        </td></tr>

        <tr><td style="padding:20px 0;">
          <span style="${LBL}">Verification link</span>
          <a href="${url}" style="${URL_STYLE}">${url}</a>
        </td></tr>

        ${HR}

        <tr><td>
          <p style="${SM}">
            If you did not create an Adventist Pulse account, no action is required.
            This email can be safely disregarded and your email address will not be used.
          </p>
        </td></tr>
      </table>`

    return send({
      to,
      subject: 'Verify your email address — Adventist Pulse',
      text: `ADVENTIST PULSE\nVerify your email address\n\nThank you for creating an account with Adventist Pulse. To activate your account, verify your email address using the link below.\n\nThis link expires in 24 hours.\n\nVerification link:\n${url}\n\n---\nIf you did not create an account, you can safely ignore this email.`,
      html: layout(body),
    })
  },

  async sendPasswordReset(to, rawToken) {
    const url = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`
    const body = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:28px;">
          <h1 style="${H1}">Password reset request</h1>
          <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#888888;">
            We received a request to reset your Adventist Pulse password
          </p>
        </td></tr>

        ${HR}

        <tr><td>
          <p style="${P}">
            A password reset was requested for the Adventist Pulse account associated with
            this email address. To proceed, follow the link below to set a new password.
          </p>
          <p style="${P}">
            This link will expire in <strong>1 hour</strong>. If it expires, you may submit
            a new password reset request from the sign-in page.
          </p>
        </td></tr>

        <tr><td style="padding:20px 0;">
          <span style="${LBL}">Password reset link</span>
          <a href="${url}" style="${URL_STYLE}">${url}</a>
        </td></tr>

        ${HR}

        <tr><td>
          <p style="${SM}">
            If you did not request a password reset, no action is required. Your password
            will remain unchanged. If you believe someone else requested this, you may
            contact support.
          </p>
        </td></tr>
      </table>`

    return send({
      to,
      subject: 'Password reset request — Adventist Pulse',
      text: `ADVENTIST PULSE\nPassword reset request\n\nA password reset was requested for the Adventist Pulse account associated with this email address.\n\nFollow the link below to set a new password. This link expires in 1 hour.\n\nPassword reset link:\n${url}\n\n---\nIf you did not request a password reset, no action is required. Your password will remain unchanged.`,
      html: layout(body),
    })
  },

  async sendPasswordChangedAlert(to, { changedAt }) {
    const formatted = new Date(changedAt).toLocaleString('en-AU', {
      timeZone: 'UTC',
      dateStyle: 'full',
      timeStyle: 'short',
    }) + ' UTC'

    const body = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:28px;">
          <h1 style="${H1}">Your password has been changed</h1>
          <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#888888;">
            Security notification for your Adventist Pulse account
          </p>
        </td></tr>

        ${HR}

        <tr><td>
          <p style="${P}">
            This is a confirmation that the password for your Adventist Pulse account was
            successfully changed.
          </p>
        </td></tr>

        <tr><td style="padding:4px 0 24px;">
          <table cellpadding="0" cellspacing="0" style="border-left:3px solid #cccccc;padding-left:16px;">
            <tr><td>
              <span style="${LBL}">Date and time</span>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111111;">${formatted}</p>
            </td></tr>
          </table>
        </td></tr>

        ${HR}

        <tr><td>
          <p style="${P}">
            If you made this change, no further action is required.
          </p>
          <p style="${P}">
            <strong>If you did not make this change</strong>, your account may have been
            accessed without your authorisation. Please contact your system administrator
            or support team immediately and do not use your current password.
          </p>
        </td></tr>

        ${HR}

        <tr><td>
          <p style="${SM}">This notification was sent automatically as a security measure.</p>
        </td></tr>
      </table>`

    return send({
      to,
      subject: 'Your Adventist Pulse password has been changed',
      text: `ADVENTIST PULSE\nYour password has been changed\n\nThis is a confirmation that the password for your Adventist Pulse account was successfully changed.\n\nDate and time: ${formatted}\n\nIf you made this change, no further action is required.\n\nIf you did NOT make this change, your account may have been accessed without your authorisation. Contact your system administrator immediately.\n\n---\nThis notification was sent automatically as a security measure.`,
      html: layout(body),
    })
  },

  async sendOAuthOnlyNotice(to) {
    const body = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:28px;">
          <h1 style="${H1}">Password reset not available</h1>
          <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#888888;">
            Regarding your Adventist Pulse account
          </p>
        </td></tr>

        ${HR}

        <tr><td>
          <p style="${P}">
            We received a request to reset the password for this email address. However,
            your Adventist Pulse account was created using Google sign-in and does not
            have a password associated with it.
          </p>
          <p style="${P}">
            To access your account, please use the <strong>Sign in with Google</strong>
            option on the sign-in page.
          </p>
          <p style="${P}">
            If you would like to add a password to your account, sign in with Google
            first and then update your security settings from your account preferences.
          </p>
        </td></tr>

        ${HR}

        <tr><td>
          <p style="${SM}">
            If you did not submit this request, no action is required. Your account
            has not been affected.
          </p>
        </td></tr>
      </table>`

    return send({
      to,
      subject: 'Password reset not available — Adventist Pulse',
      text: `ADVENTIST PULSE\nPassword reset not available\n\nWe received a request to reset the password for this email address. However, your Adventist Pulse account was created using Google sign-in and does not have a password associated with it.\n\nTo access your account, use the "Sign in with Google" option on the sign-in page.\n\nTo add a password, sign in with Google first and then update your security settings.\n\n---\nIf you did not submit this request, no action is required.`,
      html: layout(body),
    })
  },

  async sendAdminPasswordReset(to, rawToken) {
    const url = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`
    const body = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:28px;">
          <h1 style="${H1}">Action required: reset your password</h1>
          <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#888888;">
            Your Adventist Pulse administrator has initiated a password reset
          </p>
        </td></tr>

        ${HR}

        <tr><td>
          <p style="${P}">
            An administrator has initiated a password reset for your Adventist Pulse account.
            You are required to set a new password before you will be able to sign in.
          </p>
          <p style="${P}">
            Please follow the link below to set your new password. This link will expire
            in <strong>1 hour</strong>.
          </p>
        </td></tr>

        <tr><td style="padding:20px 0;">
          <span style="${LBL}">Password reset link</span>
          <a href="${url}" style="${URL_STYLE}">${url}</a>
        </td></tr>

        ${HR}

        <tr><td>
          <p style="${P}">
            Once you have set a new password, you will be prompted to change it again
            upon your next sign-in as a security precaution.
          </p>
        </td></tr>

        ${HR}

        <tr><td>
          <p style="${SM}">
            If you were not expecting this email, please contact your system administrator.
          </p>
        </td></tr>
      </table>`

    return send({
      to,
      subject: 'Action required — reset your Adventist Pulse password',
      text: `ADVENTIST PULSE\nAction required: reset your password\n\nAn administrator has initiated a password reset for your Adventist Pulse account. You are required to set a new password before you will be able to sign in.\n\nPassword reset link (expires in 1 hour):\n${url}\n\nOnce set, you will be prompted to change your password again upon your next sign-in.\n\n---\nIf you were not expecting this email, please contact your system administrator.`,
      html: layout(body),
    })
  },

  // ── Onboarding lifecycle emails ───────────────────────────────────────────

  async sendOnboardingSubmitted({ userName, userEmail }) {
    // Notify all admins — in production this would query admin emails;
    // for now we send to the configured SMTP_FROM (admin inbox)
    if (!env.SMTP_FROM) return
    const body = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:28px;">
          <h1 style="${H1}">New account application</h1>
          <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#888888;">
            A user has submitted their onboarding form and is awaiting approval
          </p>
        </td></tr>
        ${HR}
        <tr><td>
          <p style="${P}">The following user has completed the onboarding process and requires your review:</p>
        </td></tr>
        <tr><td style="padding:4px 0 24px;">
          <table cellpadding="0" cellspacing="0" style="border-left:3px solid #cccccc;padding-left:16px;">
            <tr><td style="padding-bottom:12px;">
              <span style="${LBL}">Name</span>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111111;">${userName}</p>
            </td></tr>
            <tr><td>
              <span style="${LBL}">Email</span>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111111;">${userEmail}</p>
            </td></tr>
          </table>
        </td></tr>
        ${HR}
        <tr><td>
          <p style="${SM}">Sign in to the Adventist Pulse admin panel to review and approve or reject this application.</p>
        </td></tr>
      </table>`
    return send({
      to: env.SMTP_FROM,
      subject: `New account application — ${userName}`,
      text: `ADVENTIST PULSE\nNew account application\n\nUser: ${userName}\nEmail: ${userEmail}\n\nSign in to the admin panel to review this application.`,
      html: layout(body),
    })
  },

  async sendApplicationReceived(to, name) {
    const body = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:28px;">
          <h1 style="${H1}">Application received</h1>
          <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#888888;">
            Your Adventist Pulse account application is under review
          </p>
        </td></tr>
        ${HR}
        <tr><td>
          <p style="${P}">Dear ${name},</p>
          <p style="${P}">
            Thank you for completing your Adventist Pulse profile. Your application has been
            received and is currently under review by our administration team.
          </p>
          <p style="${P}">
            You will receive an email notification once a decision has been made.
            This process typically takes one to three business days.
          </p>
        </td></tr>
        ${HR}
        <tr><td>
          <p style="${SM}">If you have any questions, please contact your local conference or division administrator.</p>
        </td></tr>
      </table>`
    return send({
      to,
      subject: 'Application received — Adventist Pulse',
      text: `ADVENTIST PULSE\nApplication received\n\nDear ${name},\n\nThank you for completing your profile. Your application is under review and you will be notified once a decision has been made.\n\n---\nThis typically takes one to three business days.`,
      html: layout(body),
    })
  },

  async sendUserApproved(to, name) {
    const body = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:28px;">
          <h1 style="${H1}">Your application has been approved</h1>
          <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#888888;">
            Welcome to Adventist Pulse
          </p>
        </td></tr>
        ${HR}
        <tr><td>
          <p style="${P}">Dear ${name},</p>
          <p style="${P}">
            We are pleased to inform you that your Adventist Pulse account application has been
            reviewed and approved. You may now sign in to access the platform.
          </p>
          <p style="${P}">
            Please sign in to your account to get started.
          </p>
        </td></tr>
        ${HR}
        <tr><td>
          <p style="${SM}">If you have any questions or require assistance, please contact your conference administrator.</p>
        </td></tr>
      </table>`
    return send({
      to,
      subject: 'Your Adventist Pulse application has been approved',
      text: `ADVENTIST PULSE\nYour application has been approved\n\nDear ${name},\n\nYour Adventist Pulse account application has been approved. You may now sign in to access the platform.\n\n---\nIf you have any questions, please contact your conference administrator.`,
      html: layout(body),
    })
  },

  async sendUserRejected(to, name, reason) {
    const reasonBlock = reason
      ? `<tr><td style="padding:4px 0 24px;">
          <table cellpadding="0" cellspacing="0" style="border-left:3px solid #cccccc;padding-left:16px;">
            <tr><td>
              <span style="${LBL}">Reason provided</span>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333333;">${reason}</p>
            </td></tr>
          </table>
        </td></tr>`
      : ''
    const body = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:28px;">
          <h1 style="${H1}">Application not approved</h1>
          <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#888888;">
            Regarding your Adventist Pulse account application
          </p>
        </td></tr>
        ${HR}
        <tr><td>
          <p style="${P}">Dear ${name},</p>
          <p style="${P}">
            After reviewing your Adventist Pulse account application, we are unable to approve
            your request at this time.
          </p>
        </td></tr>
        ${reasonBlock}
        ${HR}
        <tr><td>
          <p style="${P}">
            If you believe this decision was made in error or would like to provide additional
            information, you may sign in and resubmit your application with updated details,
            or contact your local conference administrator for assistance.
          </p>
        </td></tr>
        ${HR}
        <tr><td>
          <p style="${SM}">This decision was made by an Adventist Pulse administrator.</p>
        </td></tr>
      </table>`
    return send({
      to,
      subject: 'Adventist Pulse account application — not approved',
      text: `ADVENTIST PULSE\nApplication not approved\n\nDear ${name},\n\nAfter reviewing your application, we are unable to approve your request at this time.${reason ? `\n\nReason: ${reason}` : ''}\n\nYou may sign in and resubmit your application with updated details.\n\n---\nThis decision was made by an Adventist Pulse administrator.`,
      html: layout(body),
    })
  },

  async sendEmailChange(to, rawToken) {
    const url = `${env.FRONTEND_URL}/confirm-email-change?token=${rawToken}`
    const body = `
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:28px;">
          <h1 style="${H1}">Confirm your new email address</h1>
          <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#888888;">
            A change to your Adventist Pulse account email has been requested
          </p>
        </td></tr>

        ${HR}

        <tr><td>
          <p style="${P}">
            A request was made to update the email address associated with your
            Adventist Pulse account. To confirm this change, follow the link below.
          </p>
          <p style="${P}">
            This confirmation link will expire in <strong>1 hour</strong>. If you do
            not confirm the change within this period, your current email address will
            remain in use and no changes will be applied.
          </p>
        </td></tr>

        <tr><td style="padding:20px 0;">
          <span style="${LBL}">Email confirmation link</span>
          <a href="${url}" style="${URL_STYLE}">${url}</a>
        </td></tr>

        ${HR}

        <tr><td>
          <p style="${SM}">
            If you did not request an email address change, no action is required.
            Your current email address will remain unchanged.
          </p>
        </td></tr>
      </table>`

    return send({
      to,
      subject: 'Confirm your new email address — Adventist Pulse',
      text: `ADVENTIST PULSE\nConfirm your new email address\n\nA request was made to update the email address for your Adventist Pulse account.\n\nTo confirm this change, follow the link below. This link expires in 1 hour.\n\nConfirmation link:\n${url}\n\n---\nIf you did not request this change, no action is required. Your current email address will remain unchanged.`,
      html: layout(body),
    })
  },
}
