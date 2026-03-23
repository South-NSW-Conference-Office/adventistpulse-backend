import { z } from 'zod'

// ─── Session ──────────────────────────────────────────────────────────────────

const electedLeaderSchema = z.object({
  name:      z.string().max(200).optional(),
  title:     z.string().max(100).optional(),
  electedAt: z.string().datetime().optional(),
}).optional()

export const createSessionSchema = z.object({
  sessionNumber:            z.number().int().positive().optional(),
  dateHeld:                 z.string().datetime().optional(),
  dateEstimated:            z.string().max(50).optional(),
  cycleLengthYears:         z.number().int().positive().optional(),
  nextSessionEstimate:      z.string().max(50).optional(),
  nextSessionConfirmedDate: z.string().datetime().optional(),
  electedLeader:            electedLeaderSchema,
  location:                 z.string().max(300).optional(),
  notes:                    z.string().max(2000).optional(),
  source:                   z.string().max(500).optional(),
}).strict()

export const updateSessionSchema = createSessionSchema.partial()

// ─── ConstitutionDocument ─────────────────────────────────────────────────────

export const createConstitutionSchema = z.object({
  title:           z.string().max(300).optional(),
  version:         z.string().max(100).optional(),
  effectiveDate:   z.string().datetime().optional(),
  fileUrl:         z.string().url().optional(),
  fileSizeBytes:   z.number().int().nonnegative().optional(),
  mimeType:        z.string().max(100).optional(),
  accessLevel:     z.enum(['public', 'member', 'admin']).optional(),
  acncDocumentUrl: z.string().url().optional(),
  source:          z.string().max(500).optional(),
  notes:           z.string().max(2000).optional(),
}).strict()

// ─── SessionBooklet ───────────────────────────────────────────────────────────

export const submitBookletSchema = z.object({
  title:         z.string().max(300).optional(),
  description:   z.string().max(2000).optional(),
  fileUrl:       z.string().url().optional(),
  fileSizeBytes: z.number().int().nonnegative().optional(),
  mimeType:      z.string().max(100).optional(),
  sessionRef:    z.string().regex(/^[a-f\d]{24}$/i, 'invalid ObjectId').optional(),
  accessLevel:   z.enum(['member', 'public']).optional(),
}).strict()

export const reviewBookletSchema = z.object({
  status:      z.enum(['approved', 'rejected']),
  reviewNotes: z.string().max(2000).optional(),
}).strict()
