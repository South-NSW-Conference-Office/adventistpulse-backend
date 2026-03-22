export const response = {
  success(res, data, { statusCode = 200, meta } = {}) {
    const body = { success: true, data }
    if (meta) body.meta = meta
    return res.status(statusCode).json(body)
  },

  created(res, data) {
    return this.success(res, data, { statusCode: 201 })
  },

  paginated(res, data, { total, page, limit }) {
    return this.success(res, data, {
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  },

  badRequest(res, message = 'Bad request') {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message },
    })
  },

  notFound(res, resource = 'Resource') {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `${resource} not found` },
    })
  },

  error(res, err) {
    const statusCode = err.statusCode ?? 500
    const body = {
      success: false,
      error: {
        code: err.code ?? 'INTERNAL_ERROR',
        message: err.isOperational
          ? err.message
          : 'An unexpected error occurred. Please try again later.',
      },
    }
    // Include field-level errors for validation failures
    if (err.fields) body.error.fields = err.fields
    return res.status(statusCode).json(body)
  },
}
