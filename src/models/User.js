import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  password: { type: String, default: null, select: false },

  // Role hierarchy: admin > editor > pastor > elder > member
  // - member: free tier, read-only public data
  // - elder:  local church toolkit for delegatedAccess churches (pastor-granted)
  // - pastor: multi-church district dashboard (conference-assigned)
  // - editor: conference comms/staff (write access to content)
  // - admin:  full territory management (conference/union/division/GC)
  role: {
    type: String,
    enum: ['member', 'elder', 'pastor', 'editor', 'admin'],
    default: 'member',
  },
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

  // ─── Pastoral / Membership Layer ────────────────────────────────────────────

  // The church the user is a MEMBER of (self-declared on signup;
  // set by conference admin for nominated workers).
  memberChurch: { type: String, default: null, uppercase: true, trim: true },

  // Whether the user's membership has been confirmed by a conference admin.
  // Self-signup users start false; nominated workers start true.
  verifiedMember: { type: Boolean, default: false },

  // Churches this pastor is assigned to shepherd.
  // Set and maintained exclusively by conference admins — never self-assigned.
  assignedChurches: [{ type: String, uppercase: true, trim: true }],

  // Elder delegations — granted by a pastor, scoped per church.
  // Conference admins can revoke any delegation in their territory.
  delegatedAccess: [{
    churchCode:  { type: String, required: true, uppercase: true, trim: true },
    delegatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    grantedAt:   { type: Date, default: Date.now },
    expiresAt:   { type: Date, default: null }, // null = no expiry
  }],

  // ─── Subscription / Seat ────────────────────────────────────────────────────

  subscription: {
    // Access tier granted to this user.
    tier: {
      type: String,
      enum: ['member', 'pastor', 'admin'],
      default: 'member',
    },
    // Who is paying for this seat.
    paidBy: {
      type: String,
      enum: ['free', 'self', 'conference'],
      default: 'free',
    },
    // If conference-paid: which conference's billing account covers this seat.
    conferenceCode: { type: String, default: null, uppercase: true, trim: true },
    // Current seat status.
    status: {
      type: String,
      enum: ['active', 'invited', 'lapsed', 'cancelled'],
      default: 'active',
    },
  },

  // ─── Invitation Flow ────────────────────────────────────────────────────────

  // Populated when a conference admin nominates this person.
  // The invite token is stored hashed (same pattern as emailVerificationToken).
  inviteToken:   { type: String, default: null, select: false }, // hashed
  inviteExpires: { type: Date,   default: null, select: false },
  invitedAt:     { type: Date,   default: null },
  invitedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

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
