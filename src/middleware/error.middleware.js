import { logger } from '../core/logger.js'
import { response } from '../core/response.js'
import { AppError } from '../core/errors/index.js'

// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, next) {
  const reqMeta = { path: req.path, method: req.method, requestId: req.id }

  // Operational errors (known, expected)
  if (err instanceof AppError && err.isOperational) {
    logger.warn(`${err.code} — ${err.message}`, reqMeta)
    return response.error(res, err)
  }

  // Mongoose CastError (invalid ObjectId format)
  if (err.name === 'CastError') {
    const appErr = new AppError(`Invalid ${err.path}: '${err.value}'`, {
      code: 'INVALID_ID',
      statusCode: 400,
    })
    return response.error(res, appErr)
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? 'field'
    const appErr = new AppError(`${field} already exists`, {
      code: 'DUPLICATE_KEY',
      statusCode: 409,
    })
    return response.error(res, appErr)
  }

  // Mongoose schema validation error
  if (err.name === 'ValidationError') {
    const fields = Object.fromEntries(
      Object.entries(err.errors).map(([k, v]) => [k, [v.message]])
    )
    const appErr = new AppError('Validation failed', { code: 'VALIDATION_ERROR', statusCode: 400 })
    appErr.fields = fields
    return response.error(res, appErr)
  }

  // JWT errors that escaped our lib/jwt.js wrapper
  if (err.code === 'ERR_JWT_EXPIRED') {
    const appErr = new AppError('Token expired', { code: 'TOKEN_EXPIRED', statusCode: 401 })
    return response.error(res, appErr)
  }
  if (err.code?.startsWith('ERR_JWT') || err.code?.startsWith('ERR_JWE')) {
    const appErr = new AppError('Invalid token', { code: 'TOKEN_INVALID', statusCode: 401 })
    return response.error(res, appErr)
  }

  // Request body too large
  if (err.type === 'entity.too.large') {
    const appErr = new AppError('Request body too large', { code: 'PAYLOAD_TOO_LARGE', statusCode: 413 })
    return response.error(res, appErr)
  }

  // Malformed JSON
  if (err.type === 'entity.parse.failed') {
    const appErr = new AppError('Invalid JSON in request body', { code: 'INVALID_JSON', statusCode: 400 })
    return response.error(res, appErr)
  }

  // Unknown / programmer errors
  logger.error(`Unhandled error on ${req.method} ${req.path}`, err)
  const genericErr = new AppError('An unexpected error occurred. Please try again later.', {
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    isOperational: false,
  })
  return response.error(res, genericErr)
}
