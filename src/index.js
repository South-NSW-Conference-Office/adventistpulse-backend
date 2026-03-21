import 'dotenv/config'
import mongoose from 'mongoose'
import { env }            from './config/env.js'
import { connectDB }      from './config/db.js'
import { logger }         from './core/logger.js'
import { startScheduler } from './jobs/signal.job.js'
import app from './app.js'

async function start() {
  await connectDB()

  // Start the signal engine scheduler — runs after DB is connected
  startScheduler()

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`)
  })

  // Graceful shutdown — finish in-flight requests before closing
  async function shutdown(signal) {
    logger.info(`${signal} received — shutting down gracefully`)

    server.close(async () => {
      logger.info('HTTP server closed')
      try {
        await mongoose.connection.close()
        logger.info('MongoDB connection closed')
        process.exit(0)
      } catch (err) {
        logger.error('Error during shutdown', err)
        process.exit(1)
      }
    })

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown — timeout exceeded')
      process.exit(1)
    }, 10000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))

  // Catch unhandled errors — log and exit cleanly
  process.on('uncaughtException', err => {
    logger.error('Uncaught exception', err)
    shutdown('uncaughtException')
  })

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', reason)
    shutdown('unhandledRejection')
  })
}

start().catch(err => {
  logger.error('Failed to start server', err)
  process.exit(1)
})
