import { z } from 'zod'
import { checkPasswordStrength } from '../lib/passwordStrength.js'

// Reusable strong-password schema with zxcvbn check.
// `userInputs` are passed at service layer for contextual checks (name, email).
// At the validator layer we only do format + length + zxcvbn score check.
const strongPassword = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be no more than 128 characters')
  .superRefine((val, ctx) => {
    const result = checkPasswordStrength(val)
    if (!result.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.message })
    }
  })

export const registerSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:    z.string().email('Invalid email address').toLowerCase(),
  password: strongPassword,
})

export const loginSchema = z.object({
  email:      z.string().email('Invalid email address').toLowerCase(),
  password:   z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
})

export const resetPasswordSchema = z.object({
  token:    z.string().min(1, 'Token is required'),
  password: strongPassword,
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword:     strongPassword,
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
})

export const changeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required to confirm email change'),
})

// Public resend — no auth, just email. Rate-limited + timing-safe.
export const resendVerificationByEmailSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
})
