import { ValidationError } from '../core/errors/index.js'

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      const fields = result.error.flatten().fieldErrors
      return next(new ValidationError('Validation failed', { fields }))
    }

    if (source === 'body') {
      // body is a plain object — safe to reassign
      req.body = result.data
    } else {
      // query and params are read-only getters on Express's IncomingMessage —
      // can't reassign, must mutate in place
      Object.keys(req[source]).forEach(k => delete req[source][k])
      Object.assign(req[source], result.data)
    }

    next()
  }
}
