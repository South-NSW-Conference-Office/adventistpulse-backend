import mongoose from 'mongoose'

const constitutionDocumentSchema = new mongoose.Schema({
  entityCode:     { type: String, required: true, uppercase: true, trim: true, index: true },
  title:          { type: String },
  version:        { type: String },                           // e.g. "2025 Revision"
  effectiveDate:  { type: Date },
  fileUrl:        { type: String },                           // S3/Cloudinary URL
  fileSizeBytes:  { type: Number },
  mimeType:       { type: String, default: 'application/pdf' },
  accessLevel:    {
    type:    String,
    enum:    ['public', 'member', 'admin'],
    default: 'member',
  },
  acncDocumentUrl: { type: String },                          // ACNC charity register URL if applicable
  source:          { type: String },
  uploadedBy:      { type: String },                          // user ID or "system"
  notes:           { type: String },
}, { timestamps: true })

// One active constitution per entity is the common case; index supports fast lookup
constitutionDocumentSchema.index({ entityCode: 1, effectiveDate: -1 })

export const ConstitutionDocument = mongoose.model('ConstitutionDocument', constitutionDocumentSchema)
