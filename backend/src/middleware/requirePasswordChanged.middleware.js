import { AppError } from '../core/errors/index.js'

// Must be used AFTER authMiddleware.
// When mustChangePassword is true, ALL routes are blocked except the auth escape hatches.
// Apply this via router.use(authMiddleware, requirePasswordChanged) on any protected router.
export function requirePasswordChanged(req, res, next) {
  if (!req.user?.mustChangePassword) return next()
  next(new AppError(
    'You must change your password before accessing this resource.',
    { code: 'PASSWORD_CHANGE_REQUIRED', statusCode: 403 }
  ))
}
