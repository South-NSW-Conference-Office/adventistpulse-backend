/**
 * Invitation Service
 *
 * Handles conference-admin-initiated invitations for pastors and workers.
 * Key principle: conference nomination = verification.
 * When an admin nominates a pastor, the account is pre-configured before
 * the user ever clicks the invite link.
 */

import { randomBytes } from 'crypto'
import { User } from '../models/User.js'
import { PersonnelAssignment } from '../models/PersonnelAssignment.js'
import { crypto as cryptoLib } from '../lib/crypto.js'
import { email } from '../lib/email.js'
import { env } from '../config/env.js'
import { logger } from '../core/logger.js'

// Load the denominational domain map (advisory, not a blocker)
import emailDomains from '../../data/email-domains.json' with { type: 'json' }
const TRUSTED_DOMAINS = new Set(emailDomains.known_trusted_domains ?? [])

export const invitationService = {

  /**
   * Check whether an email domain matches a known denominational domain.
   * Returns { trusted: bool, matchedEntity: string|null }
   * Advisory only — never used to block an invitation.
   */
  checkDomain(emailAddress) {
    const domain = emailAddress.split('@')[1]?.toLowerCase()
    if (!domain) return { trusted: false, matchedEntity: null }

    if (TRUSTED_DOMAINS.has(domain)) return { trusted: true, matchedEntity: domain }

    // Also check division/union/conference domain maps
    for (const [code, domains] of Object.entries({
      ...emailDomains.divisions,
      ...emailDomains.unions,
      ...emailDomains.conferences,
    })) {
      if (domains.includes(domain)) return { trusted: true, matchedEntity: code }
    }

    return { trusted: false, matchedEntity: null }
  },

  /**
   * Nominate a pastor or worker.
   * Creates the User account (pre-configured), sends invite email.
   *
   * @param {object} params
   * @param {string} params.name
   * @param {string} params.email
   * @param {string} params.role          - 'pastor'|'elder'|'editor'|'admin'
   * @param {string} params.memberChurch  - church code where they're a member
   * @param {string[]} params.assignedChurches - churches they pastor (for pastors)
   * @param {string} params.conferenceCode
   * @param {'conference'|'self'} params.paidBy
   * @param {object} params.invitedByUser - the admin User document
   */
  async nominate({
    name, email: emailAddress, role, memberChurch,
    assignedChurches = [], conferenceCode, paidBy = 'conference',
    invitedByUser,
  }) {
    // Check if user already exists
    const existing = await User.findOne({ email: emailAddress.toLowerCase() })
    if (existing) {
      // If already invited/pending, resend
      if (existing.subscription?.status === 'invited') {
        return invitationService.resendInvite(existing, invitedByUser)
      }
      throw new Error(`An account with email ${emailAddress} already exists.`)
    }

    // Generate invite token (raw for email link, hashed for storage)
    const rawToken = randomBytes(32).toString('hex')
    const hashedToken = cryptoLib.hashToken(rawToken)

    // Create the pre-configured user account.
    // emailVerified and accountStatus are pre-existing User schema fields —
    // we set them here because conference nomination is the verification step:
    // the admin vouches for the email, so no separate email verification needed.
    const user = await User.create({
      name,
      email: emailAddress.toLowerCase(),
      password: null, // set when invite is accepted via acceptInvite()
      role,
      memberChurch:      memberChurch?.toUpperCase() || null,
      verifiedMember:    true, // conference nomination = verified
      assignedChurches:  assignedChurches.map(c => c.toUpperCase()),
      subscription: {
        tier:           role === 'admin' ? 'admin' : (role === 'pastor' || role === 'elder') ? 'pastor' : 'member',
        paidBy,
        conferenceCode: conferenceCode?.toUpperCase() || null,
        status:         'invited',
      },
      inviteToken:   hashedToken,
      inviteExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      invitedAt:     new Date(),
      invitedBy:     invitedByUser._id,
      // Pre-existing schema fields — set intentionally:
      emailVerified: true,       // conference vouches for the address; skip email verify step
      accountStatus: 'approved', // skip approval queue; conference is the approver
    })

    // Send invite email
    await invitationService._sendInviteEmail({
      to: emailAddress,
      name,
      role,
      rawToken,
      conferenceCode,
      invitedByName: invitedByUser.name,
    })

    logger.info('Pastor nominated', {
      nominatedEmail: emailAddress,
      role,
      conferenceCode,
      assignedChurches,
      invitedBy: invitedByUser.email,
    })

    return {
      userId: user._id,
      email: user.email,
      role: user.role,
      assignedChurches: user.assignedChurches,
      domainCheck: invitationService.checkDomain(emailAddress),
    }
  },

  /**
   * Accept an invitation — set password, activate account.
   */
  async acceptInvite({ token, password }) {
    const hashedToken = cryptoLib.hashToken(token)

    const user = await User.findOne({
      inviteToken: hashedToken,
      inviteExpires: { $gt: new Date() },
      'subscription.status': 'invited',
    }).select('+inviteToken +inviteExpires')

    if (!user) throw new Error('Invite link is invalid or has expired.')

    // Set password and activate
    const hashedPassword = await cryptoLib.hashPassword(password)
    user.password = hashedPassword
    user.inviteToken = null
    user.inviteExpires = null
    user.subscription.status = 'active'
    await user.save()

    logger.info('Invite accepted', { email: user.email, role: user.role })
    return user
  },

  /**
   * Resend invite to a pending user.
   */
  async resendInvite(user, invitedByUser) {
    const rawToken = randomBytes(32).toString('hex')
    const hashedToken = cryptoLib.hashToken(rawToken)

    user.inviteToken = hashedToken
    user.inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await user.save()

    await invitationService._sendInviteEmail({
      to: user.email,
      name: user.name,
      role: user.role,
      rawToken,
      conferenceCode: user.subscription?.conferenceCode,
      invitedByName: invitedByUser?.name ?? 'Conference Admin',
    })

    return { resent: true, email: user.email }
  },

  async _sendInviteEmail({ to, name, role, rawToken, conferenceCode, invitedByName }) {
    const inviteUrl = `${env.FRONTEND_URL}/accept-invite?token=${rawToken}`
    await email.sendInvite(to, {
      inviteeName:    name,
      inviterName:    invitedByName,
      conferenceCode,
      conferenceName: conferenceCode, // TODO: fetch human-readable name from OrgUnit
      role,
      inviteUrl,
    })
  },
}
