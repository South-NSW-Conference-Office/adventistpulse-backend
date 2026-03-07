import mongoose from 'mongoose'
import { env } from './env.js'
import { logger } from '../core/logger.js'

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGODB_URI)
    logger.info(`Connected to MongoDB: ${mongoose.connection.name}`)
  } catch (err) {
    logger.error('MongoDB connection failed', err)
    process.exit(1)
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected')
  })

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected')
  })
}
