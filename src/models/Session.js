import mongoose from 'mongoose'

const electedLeaderSchema = new mongoose.Schema({
  name:      { type: String },
  title:     { type: String },   // "President", "Chair", etc.
  electedAt: { type: Date },
}, { _id: false })

const sessionSchema = new mongoose.Schema({
  entityCode:               { type: String, required: true, uppercase: true, trim: true, index: true },
  sessionNumber:            { type: Number },                // e.g. 60 for the 60th session
  dateHeld:                 { type: Date },                  // confirmed date; null if not yet confirmed
  dateEstimated:            { type: String },                // e.g. "Est. 2029"
  cycleLengthYears:         { type: Number },                // 4 or 5
  nextSessionEstimate:      { type: String },                // e.g. "Est. 2029"
  nextSessionConfirmedDate: { type: Date },                  // set when admin confirms the next date
  electedLeader:            { type: electedLeaderSchema },
  location:                 { type: String },                // e.g. "Canberra, ACT"
  notes:                    { type: String },
  source:                   { type: String },                // e.g. "Calvin (Gen Sec SNSW)", "ACNC filing"
}, { timestamps: true })

// Compound index for common query: all sessions for an entity, newest first
sessionSchema.index({ entityCode: 1, dateHeld: -1 })

export const Session = mongoose.model('Session', sessionSchema)
