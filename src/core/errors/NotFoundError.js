import { AppError } from './AppError.js'

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, { code: 'NOT_FOUND', statusCode: 404 })
  }
}
