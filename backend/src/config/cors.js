import { env } from './env.js'

export const corsOptions = {
  origin: env.FRONTEND_URL,
  credentials: true, // allow cookies (refresh token)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-New-Access-Token'], // silent token rotation header
}
