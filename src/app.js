import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { corsOptions } from './config/cors.js'
import { apiRateLimit } from './middleware/rateLimit.middleware.js'
import { errorMiddleware } from './middleware/error.middleware.js'
import { requestIdMiddleware } from './middleware/requestId.middleware.js'
import { auditMiddleware } from './middleware/audit.middleware.js'
import routes from './routes/index.js'

const app = express()

// Security
app.use(helmet())
app.use(cors(corsOptions))

// Request ID — before everything so all logs have it
app.use(requestIdMiddleware)

// Parsing — limit body size to prevent payload attacks
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(cookieParser())

// Logging — custom format that never logs request body (avoids logging passwords)
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :req[x-request-id]'))

// Audit trail for write operations
app.use(auditMiddleware)

// Rate limiting on all API routes
app.use('/api', apiRateLimit)

// Routes — all under /api
app.use('/api', routes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: 'v1', requestId: req.id })
})

// 404 — route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  })
})

// Global error handler — must be last
app.use(errorMiddleware)

export default app
