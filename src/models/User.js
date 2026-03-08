import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  password: { type: String, default: null, select: false },

  role:         { type: String, enum: ['admin', 'editor', 'viewer'], default: 'viewer' },
  entityAccess: [{ type: String }],

  // Email verification — token stored as SHA-256 hash, never plaintext
  emailVerified:            { type: Boolean, default: false },
  emailVerificationToken:   { type: String, default: null, select: false }, // hashed
  emailVerificationExpires: { type: Date,   default: null, select: false },
  verificationEmailSentAt:  { type: Date,   default: null, select: false }, // resend cooldown

  // Password reset — token stored as SHA-256 hash, never plaintext
  passwordResetToken:   { type: String, default: null, select: false }, // hashed
  passwordResetExpires: { type: Date,   default: null, select: false },
  resetEmailSentAt:     { type: Date,   default: null, select: false }, // per-email rate limit
  passwordChangedAt:    { type: Date,   default: null },                // session invalidation

  // Email change flow
  pendingEmail:          { type: String, default: null, select: false },
  emailChangeToken:      { type: String, default: null, select: false }, // hashed
  emailChangeExpires:    { type: Date,   default: null, select: false },

  // Account lockout
  loginAttempts: { type: Number, default: 0, select: false },
  lockUntil:     { type: Date,   default: null, select: false },

  // OAuth
  oauthProviders: [{
    provider:          String,
    providerAccountId: String,
    linkedAt:          { type: Date, default: Date.now },
  }],

  // Onboarding & approval lifecycle
  // Default 'approved' protects all existing users — new users transition through the lifecycle
  accountStatus: {
    type:    String,
    enum:    ['pending_onboarding', 'pending_approval', 'approved', 'rejected'],
    default: 'approved',
    index:   true,
  },
  rejectionReason: { type: String, default: null, select: false },
  approvedAt:      { type: Date,   default: null },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectedAt:      { type: Date,   default: null },
  rejectedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  isActive: { type: Boolean, default: true },

  // Admin-initiated force-change: user must change password on next login
  mustChangePassword: { type: Boolean, default: false },
}, { timestamps: true })

// email: unique:true on the field already creates the index
userSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now()
})

export const User = mongoose.model('User', userSchema)

export const MAX_LOGIN_ATTEMPTS = 5
export const LOCK_DURATION_MS   = 15 * 60 * 1000
export const RESET_EMAIL_COOLDOWN_MS  = 60 * 60 * 1000  // 1 per email per hour
export const RESEND_VERIFY_COOLDOWN_MS = 2 * 60 * 1000  // 2 min cooldown between resends
