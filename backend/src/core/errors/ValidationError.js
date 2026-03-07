import { AppError } from './AppError.js'

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', { fields } = {}) {
    super(message, { code: 'VALIDATION_ERROR', statusCode: 400 })
    this.fields = fields ?? null  // optional field-level errors from Zod
  }
}
