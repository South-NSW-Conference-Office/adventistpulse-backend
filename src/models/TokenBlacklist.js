import mongoose from 'mongoose'

const tokenBlacklistSchema = new mongoose.Schema({
  jti:       { type: String, required: true, unique: true },
  type:      { type: String, enum: ['access', 'refresh'], default: 'refresh' },
  expiresAt: { type: Date, required: true },
})

// TTL index — MongoDB auto-deletes expired entries
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema)
