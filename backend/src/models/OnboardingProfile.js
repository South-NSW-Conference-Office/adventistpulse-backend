import mongoose from 'mongoose'

/**
 * OnboardingProfile — stores the form data submitted by a user
 * during onboarding. One document per user (upserted on re-submission).
 * Does NOT store approval state — that lives on User.accountStatus.
 */
const onboardingProfileSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
    unique:   true,
    index:    true,
  },

  // Personal
  phone:   { type: String, default: null, trim: true },
  country: { type: String, required: true, trim: true },

  // SDA organisational affiliation — display names (strings) + entity refs (ObjectIds)
  division:       { type: String, required: true, trim: true },
  union:          { type: String, required: true, trim: true },
  conference:     { type: String, required: true, trim: true },
  localChurch:    { type: String, required: true, trim: true },

  divisionId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Entity', default: null },
  unionId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Entity', default: null },
  conferenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Entity', default: null },

  // Role within the church
  churchRole: {
    type:     String,
    required: true,
    enum: [
      'member',
      'deacon',
      'deaconess',
      'elder',
      'pastor',
      'bible_worker',
      'local_church_officer',
      'conference_officer',
      'union_officer',
      'division_officer',
      'gc_officer',
      'other',
    ],
  },
  roleDescription: { type: String, default: null, trim: true }, // optional clarification

  // Why do you need access?
  purposeStatement: { type: String, required: true, trim: true, minlength: 20 },

  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true })

export const OnboardingProfile = mongoose.model('OnboardingProfile', onboardingProfileSchema)
