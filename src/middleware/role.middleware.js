import { ForbiddenError } from '../core/errors/index.js'

/**
 * Role hierarchy — higher number = more access.
 * Updated to reflect the full Pulse pastoral model:
 *   member  → elder → pastor → editor → admin
 *
 * NOTE: 'viewer' is mapped to 'member' for backwards compatibility
 * with any existing tokens/records that use the old enum value.
 */
const ROLE_HIERARCHY = {
  // Legacy alias
  viewer: 0,
  // Current roles
  member: 0,
  elder:  1,
  pastor: 2,
  editor: 3,
  admin:  4,
}

/**
 * requireRole(...roles)
 *
 * Passes if the authenticated user's role is >= ANY of the specified roles.
 * Example: requireRole('pastor') allows pastor, editor, and admin through.
 *
 * @param {...string} roles - minimum role(s) required
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    const userRole  = req.user?.role
    const userLevel = ROLE_HIERARCHY[userRole] ?? -1
    const allowed   = roles.some(role => userLevel >= (ROLE_HIERARCHY[role] ?? Infinity))
    if (!allowed) return next(new ForbiddenError())
    next()
  }
}
