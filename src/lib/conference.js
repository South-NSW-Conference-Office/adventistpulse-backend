import { ForbiddenError } from '../core/errors/index.js'

/**
 * Extract the caller's conference code from their JWT-sourced subscription.
 * Never trust conference codes from req.body or req.params.
 */
export function getCallerConference(req) {
  const code = req.user?.subscription?.conferenceCode
  if (!code) throw new ForbiddenError('No conference assigned to your account')
  return code.toUpperCase()
}
