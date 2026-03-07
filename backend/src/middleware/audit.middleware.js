import { logger } from '../core/logger.js'

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// Logs all state-changing requests with user context for audit trail
export function auditMiddleware(req, res, next) {
  if (!WRITE_METHODS.has(req.method)) return next()

  const originalEnd = res.end.bind(res)
  res.end = function (...args) {
    logger.info(`[AUDIT] ${req.method} ${req.path}`, {
      requestId: req.id,
      userId:    req.user?.sub ?? 'unauthenticated',
      role:      req.user?.role ?? null,
      status:    res.statusCode,
      ip:        req.ip,
    })
    return originalEnd(...args)
  }

  next()
}
