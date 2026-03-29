import { z } from 'zod'

/** POST /start — begin a new spiritual gifts assessment */
export const startAssessmentSchema = z.object({
  firstName:  z.string().min(1).max(60).trim(),
  lastName:   z.string().min(1).max(60).trim(),
  email:      z.string().email().max(120).toLowerCase().trim(),
  churchCode: z.string().max(20).toUpperCase().optional().nullable().default(null),
  version:    z.enum(['standard', 'adventist']).optional().default('adventist'),
})

/** Single response item */
const responseItemSchema = z.object({
  questionId: z.string().min(1).max(60),
  score:      z.number().int().min(1).max(5),
})

/** POST /submit — submit all responses */
export const submitResponsesSchema = z.object({
  sessionToken: z.string().min(10).max(40),
  responses:    z.array(responseItemSchema).min(1),
})
