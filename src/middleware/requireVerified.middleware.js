import { EmailNotVerifiedError } from '../core/errors/index.js'

// Must be used AFTER authMiddleware
// Blocks access to protected resources until email is verified
export function requireVerified(req, res, next) {
  if (!req.user?.emailVerified) return next(new EmailNotVerifiedError())
  next()
}
