import mongoose from 'mongoose'

const sessionBookletSchema = new mongoose.Schema({
  entityCode:   { type: String, required: true, uppercase: true, trim: true, index: true },
  sessionRef:   { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  title:        { type: String },
  description:  { type: String },
  fileUrl:      { type: String },
  fileSizeBytes:{ type: Number },
  mimeType:     { type: String, default: 'application/pdf' },
  submittedBy:  { type: String },                              // user ID
  submittedAt:  { type: Date },
  status:       {
    type:    String,
    enum:    ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy:   { type: String },                              // user ID of reviewer
  reviewedAt:   { type: Date },
  reviewNotes:  { type: String },
  accessLevel:  {
    type:    String,
    enum:    ['member', 'public'],
    default: 'member',
  },
}, { timestamps: true })

// Efficient fetch of approved booklets for an entity
sessionBookletSchema.index({ entityCode: 1, status: 1, createdAt: -1 })

export const SessionBooklet = mongoose.model('SessionBooklet', sessionBookletSchema)
