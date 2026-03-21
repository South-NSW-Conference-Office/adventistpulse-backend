import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT:     z.string().default('5001').transform(Number),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // Comma-separated for secret rotation: "newSecret,oldSecret"
  JWT_SECRET:                  z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY_SECONDS:          z.string().default('900').transform(Number),
  JWT_REFRESH_EXPIRY_SECONDS:         z.string().default('604800').transform(Number),   // 7 days
  JWT_REMEMBER_ME_EXPIRY_SECONDS:     z.string().default('2592000').transform(Number),  // 30 days

  // Required in production — invite email links will be broken without it.
  // Default only applies in development/test.
  FRONTEND_URL: z.string().url('FRONTEND_URL must be a valid URL')
    .refine(
      (val) => process.env.NODE_ENV !== 'production' || !val.includes('localhost'),
      { message: 'FRONTEND_URL must not be localhost in production' }
    )
    .default('http://localhost:3000'),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX:       z.string().default('10').transform(Number),

  // SMTP — optional, emails silently skipped if not configured
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform(v => v ? Number(v) : 587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional().default('noreply@adventistpulse.com'),

  // Brevo — optional, beta signup flow
  BREVO_API_KEY: z.string().optional(),
  ADMIN_DASHBOARD_URL: z.string().optional().default('https://adventistpulse.org/admin'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('[pulse][error] Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
