import { invitationService } from '../services/invitation.service.js'
import { response } from '../core/response.js'
import { asyncHandler } from './base.controller.js'
import { getCallerConference } from '../lib/conference.js'

export const invitationController = {

  /** POST /admin/invite — conference admin nominates a pastor/worker */
  nominate: asyncHandler(async (req, res) => {
    const conferenceCode = getCallerConference(req)

    const { name, email, role, memberChurch, assignedChurches, paidBy } = req.body

    const result = await invitationService.nominate({
      name,
      email,
      role,
      memberChurch,
      assignedChurches: assignedChurches ?? [],
      conferenceCode, // pinned — body value ignored
      paidBy: paidBy ?? 'conference',
      invitedByUser: req.user,
    })

    response.created(res, result)
  }),

  /** POST /auth/accept-invite — invited user sets password */
  acceptInvite: asyncHandler(async (req, res) => {
    const { token, password } = req.body
    const user = await invitationService.acceptInvite({ token, password })
    response.success(res, {
      message: 'Account activated. You can now log in.',
      email: user.email,
      role: user.role,
    })
  }),

  /** GET /admin/invite/check-domain — advisory domain check */
  checkDomain: asyncHandler(async (req, res) => {
    const { email } = req.query
    const result = invitationService.checkDomain(email ?? '')
    response.success(res, result)
  }),
}
