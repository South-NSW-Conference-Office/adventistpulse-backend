import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'

const SALT_ROUNDS = 12

export const crypto = {
  async hash(plaintext) {
    return bcrypt.hash(plaintext, SALT_ROUNDS)
  },

  async compare(plaintext, hash) {
    return bcrypt.compare(plaintext, hash)
  },

  // SHA-256 hash for verification/reset tokens stored in DB
  // Raw token goes in the email; hashed token stored in DB
  hashToken(rawToken) {
    return createHash('sha256').update(rawToken).digest('hex')
  },
}
