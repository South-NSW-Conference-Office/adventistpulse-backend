import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'

const isDev = env.NODE_ENV === 'development'

const message = {
  success: false,
  error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
}

function makeLimit({ windowMs, max, devMax }) {
  return rateLimit({
    windowMs,
    max: isDev ? devMax : max,
    standardHeaders: true,
    legacyHeaders: false,
    message,
  })
}

// Login + Register — strict, brute force / credential stuffing protection
export const loginRateLimit    = makeLimit({ windowMs: 15 * 60 * 1000, max: 10,  devMax: 200 })
export const registerRateLimit = makeLimit({ windowMs: 15 * 60 * 1000, max: 10,  devMax: 200 })

// Refresh — user may have many tabs / short-lived sessions
export const refreshRateLimit  = makeLimit({ windowMs: 15 * 60 * 1000, max: 60,  devMax: 500 })

// Password reset / email verification — low volume, abuse-prone
export const forgotPasswordRateLimit = makeLimit({ windowMs: 15 * 60 * 1000, max: 5, devMax: 50 })
export const resetPasswordRateLimit  = makeLimit({ windowMs: 15 * 60 * 1000, max: 5, devMax: 50 })
export const verifyEmailRateLimit    = makeLimit({ windowMs: 15 * 60 * 1000, max: 5, devMax: 50 })

// General API routes — covers /entities, /stats, /auth/me, /auth/logout
export const apiRateLimit = makeLimit({ windowMs: 60 * 1000, max: 200, devMax: 2000 })

// Survey respond endpoint — public, IP-gated: 3 per IP per 15 minutes
export const surveyRespondRateLimit = makeLimit({ windowMs: 15 * 60 * 1000, max: 3, devMax: 100 })

// Google Places proxy — public, unauthenticated: 30 req/min per IP
// Prevents use of the backend as a free Google Places API proxy.
export const churchPlacesRateLimit = makeLimit({ windowMs: 60 * 1000, max: 30, devMax: 300 })

// Survey Engine respond — public, IP-gated: mirrors surveyRespondRateLimit
export const surveyEngineRespondRateLimit = makeLimit({ windowMs: 15 * 60 * 1000, max: 3, devMax: 100 })

// AI assistance endpoints — per-user (req.user._id), 20 requests per hour
export const aiUserRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 500 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.user?._id?.toString() ?? req.ip,
  message,
})
