/**
 * One-shot seed script — creates the super admin account.
 * Run: node scripts/seed-superadmin.js
 * Safe to run multiple times (upsert).
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const SALT_ROUNDS = 12

const userSchema = new mongoose.Schema({
  name:                     { type: String, required: true },
  email:                    { type: String, required: true, unique: true, lowercase: true },
  password:                 { type: String, default: null },
  role:                     { type: String, enum: ['admin', 'editor', 'viewer'], default: 'viewer' },
  entityAccess:             [{ type: String }],
  emailVerified:            { type: Boolean, default: false },
  emailVerificationToken:   { type: String, default: null },
  emailVerificationExpires: { type: Date,   default: null },
  verificationEmailSentAt:  { type: Date,   default: null },
  passwordResetToken:       { type: String, default: null },
  passwordResetExpires:     { type: Date,   default: null },
  resetEmailSentAt:         { type: Date,   default: null },
  passwordChangedAt:        { type: Date,   default: null },
  pendingEmail:             { type: String, default: null },
  emailChangeToken:         { type: String, default: null },
  emailChangeExpires:       { type: Date,   default: null },
  loginAttempts:            { type: Number, default: 0 },
  lockUntil:                { type: Date,   default: null },
  oauthProviders:           [{ provider: String, providerAccountId: String, linkedAt: Date }],
  isActive:                 { type: Boolean, default: true },
  mustChangePassword:       { type: Boolean, default: false },
}, { timestamps: true })

const User = mongoose.model('User', userSchema)

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('❌  MONGODB_URI not set in .env')
    process.exit(1)
  }

  console.log('🔌  Connecting to MongoDB…')
  await mongoose.connect(uri)
  console.log('✅  Connected')

  const email = 'bem@gyocc.org'
  const password = 'Digitalmission2126-'

  console.log(`🔐  Hashing password (bcrypt, ${SALT_ROUNDS} rounds)…`)
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

  const update = {
    name:              'Bem',
    password:          hashedPassword,
    role:              'admin',           // highest role in the system
    entityAccess:      [],                // full access — no entity restriction for admin
    emailVerified:     true,              // pre-verified, no email loop needed
    isActive:          true,
    mustChangePassword: false,
    // Clear any stale lockout or reset tokens
    loginAttempts:     0,
    lockUntil:         null,
    passwordResetToken:   null,
    passwordResetExpires: null,
  }

  const user = await User.findOneAndUpdate(
    { email },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  console.log('\n✅  Super admin upserted successfully:')
  console.log(`   ID:    ${user._id}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Role:  ${user.role}`)
  console.log(`   emailVerified: ${user.emailVerified}`)
  console.log(`   isActive:      ${user.isActive}`)

  await mongoose.disconnect()
  console.log('\n🔌  Disconnected. Done.')
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message)
  process.exit(1)
})
