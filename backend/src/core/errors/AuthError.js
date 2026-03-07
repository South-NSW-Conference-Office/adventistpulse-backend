import { AppError } from './AppError.js'

export class InvalidCredentialsError extends AppError {
  constructor() {
    super('Invalid email or password', { code: 'INVALID_CREDENTIALS', statusCode: 401 })
  }
}

export class TokenExpiredError extends AppError {
  constructor() {
    super('Access token expired', { code: 'TOKEN_EXPIRED', statusCode: 401 })
  }
}

export class TokenInvalidError extends AppError {
  constructor() {
    super('Invalid token', { code: 'TOKEN_INVALID', statusCode: 401 })
  }
}

export class TokenRevokedError extends AppError {
  constructor() {
    super('Token has been revoked', { code: 'TOKEN_REVOKED', statusCode: 401 })
  }
}

export class RefreshTokenMissingError extends AppError {
  constructor() {
    super('Refresh token not found', { code: 'REFRESH_TOKEN_MISSING', statusCode: 401 })
  }
}

export class EmailTakenError extends AppError {
  constructor() {
    super('An account with this email already exists', { code: 'EMAIL_TAKEN', statusCode: 409 })
  }
}

export class AccountNotLinkedError extends AppError {
  constructor() {
    super('An account already exists with this email. Log in with your password, then link in Settings.', {
      code: 'ACCOUNT_NOT_LINKED',
      statusCode: 409,
    })
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor() {
    super('Please verify your email address before accessing this resource.', {
      code: 'EMAIL_NOT_VERIFIED',
      statusCode: 403,
    })
  }
}

export class ResendCooldownError extends AppError {
  constructor(secondsLeft) {
    super(`Please wait ${secondsLeft} seconds before requesting another verification email.`, {
      code: 'RESEND_COOLDOWN',
      statusCode: 429,
    })
  }
}

export class ResetRateLimitError extends AppError {
  constructor() {
    super('A password reset email was recently sent to this address. Please check your inbox or try again later.', {
      code: 'RESET_RATE_LIMITED',
      statusCode: 429,
    })
  }
}
