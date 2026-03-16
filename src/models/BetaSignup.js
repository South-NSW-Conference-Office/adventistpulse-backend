import mongoose from 'mongoose'

const betaSignupSchema = new mongoose.Schema({
  firstName:        { type: String, required: true, trim: true },
  lastName:         { type: String, trim: true },
  email:            { type: String, required: true, lowercase: true, trim: true, unique: true },
  church:           { type: String, required: true, trim: true },
  conference:       { type: String, trim: true },
  role:             { type: String, required: true, trim: true },
  pastorEmail:      { type: String, lowercase: true, trim: true },
  approvalStatus:   { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  pastorConfirmed:  { type: Boolean, default: null },
}, { timestamps: true })

export const BetaSignup = mongoose.model('BetaSignup', betaSignupSchema)
