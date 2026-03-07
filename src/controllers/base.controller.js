// Wraps async route handlers — catches errors and forwards to error middleware
export const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
