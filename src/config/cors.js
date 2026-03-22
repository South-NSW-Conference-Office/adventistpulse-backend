import { env } from './env.js'

const allowedOrigins = [env.FRONTEND_URL, env.ADMIN_DASHBOARD_URL].filter(Boolean)

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true, // allow cookies (refresh token)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-New-Access-Token'], // silent token rotation header
}
