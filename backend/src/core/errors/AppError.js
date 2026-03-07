export class AppError extends Error {
  constructor(message, { code, statusCode = 500, isOperational = true, cause } = {}) {
    super(message)
    this.name = this.constructor.name
    this.code = code ?? 'INTERNAL_ERROR'
    this.statusCode = statusCode
    this.isOperational = isOperational  // false = programmer error, not user error
    this.cause = cause                  // logged server-side only, never sent to client
    Error.captureStackTrace(this, this.constructor)
  }
}
