import { ForbiddenError } from '../core/errors/index.js'

const ROLE_HIERARCHY = { viewer: 0, editor: 1, admin: 2 }

export function requireRole(...roles) {
  return (req, res, next) => {
    const userRole = req.user?.role
    const allowed = roles.some(role => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role])
    if (!allowed) return next(new ForbiddenError())
    next()
  }
}
