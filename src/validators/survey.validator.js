import { z } from 'zod'

// All valid question IDs
const VALID_QUESTION_IDS = new Set([
  'SV-1', 'SV-2', 'SV-3', 'SV-4', 'SV-5', 'SV-6',
  'CH-1', 'CH-2', 'CH-3', 'CH-4', 'CH-5', 'CH-6',
  'FS-1', 'FS-2', 'FS-3', 'FS-4',
  'ME-1', 'ME-2', 'ME-3', 'ME-4', 'ME-5', 'ME-6',
  'LG-1', 'LG-2', 'LG-3', 'LG-4', 'LG-5',
])

const REQUIRED_QUESTION_IDS = [...VALID_QUESTION_IDS]
const TOTAL_QUESTIONS = REQUIRED_QUESTION_IDS.length  // 27

// Strict answers validator: must contain all 27 question IDs with integer values 1–5
const answersSchema = z
  .record(z.string(), z.number())
  .superRefine((answers, ctx) => {
    const providedKeys = Object.keys(answers)

    // Check for invalid question IDs
    for (const key of providedKeys) {
      if (!VALID_QUESTION_IDS.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid question ID: '${key}'`,
          path: [key],
        })
      }
    }

    // Check all required questions are present
    for (const qId of REQUIRED_QUESTION_IDS) {
      if (!(qId in answers)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing answer for required question: '${qId}'`,
          path: [qId],
        })
      }
    }

    // Validate all values are integers 1–5
    for (const [qId, value] of Object.entries(answers)) {
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Answer for '${qId}' must be an integer between 1 and 5`,
          path: [qId],
        })
      }
    }
  })

// ─── Session creation ──────────────────────────────────────────────────────────

export const createSessionSchema = z.object({
  churchCode: z
    .string({ required_error: 'churchCode is required' })
    .min(1)
    .max(50)
    .transform(v => v.toUpperCase().trim()),

  settings: z.object({
    requirePhone:     z.boolean().default(false),
    maxResponses:     z.number().int().positive().nullable().default(null),
    expiryMinutes:    z.number().int().min(15).max(480).default(60),
    denominationType: z.enum(['adventist', 'other', 'auto']).default('auto'),
  }).default({}),
})

// ─── Response submission ───────────────────────────────────────────────────────

export const submitResponseSchema = z.object({
  answers: answersSchema,

  denominationType: z.enum(['adventist', 'other'], {
    required_error: 'denominationType is required',
    invalid_type_error: "denominationType must be 'adventist' or 'other'",
  }),

  dedupeToken: z
    .string({ required_error: 'dedupeToken is required' })
    .uuid({ message: 'dedupeToken must be a valid UUID' }),

  // Phase 2: phone for requirePhone sessions — optional now
  phone: z.string().optional(),
})

// ─── List sessions (query params) ─────────────────────────────────────────────

export const listSessionsSchema = z.object({
  churchCode: z.string().min(1).max(50).transform(v => v.toUpperCase()).optional(),
  status:     z.enum(['active', 'closed']).optional(),
  page:       z.string().optional().transform(v => Math.max(1, parseInt(v ?? '1', 10) || 1)),
  limit:      z.string().optional().transform(v => Math.min(100, Math.max(1, parseInt(v ?? '20', 10) || 20))),
})
