import { z } from 'zod'
import { ANCHOR_QUESTION_COUNT } from '../lib/giftsEngine/questions.js'

// Phase 2 constants — coupled to getPhase2Candidates() in gifts.service.js.
// If maxCandidates or deep questions-per-gift changes, update these too.
const MAX_PHASE2_CANDIDATES    = 5
const DEEP_QUESTIONS_PER_GIFT  = 4
const MAX_PHASE2_RESPONSES     = MAX_PHASE2_CANDIDATES * DEEP_QUESTIONS_PER_GIFT // 20

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

/** POST /submit-phase1 — submit Phase 1 screening responses.
 *  Both standard and adventist versions have ANCHOR_QUESTION_COUNT (22) questions.
 *  Tongues is included in the Adventist set (reframed as xenolalia), so both
 *  versions submit exactly 22 anchor responses.
 */
export const submitPhase1Schema = z.object({
  sessionToken: z.string().min(10).max(40),
  responses: z.array(z.object({
    questionId: z.string().min(1).max(60),
    score: z.number().int().min(1).max(5),
  })).length(ANCHOR_QUESTION_COUNT),
})

/** POST /submit-phase2 — submit Phase 2 deep-dive responses.
 *  Max = MAX_PHASE2_CANDIDATES gifts × DEEP_QUESTIONS_PER_GIFT questions each.
 */
export const submitPhase2Schema = z.object({
  sessionToken: z.string().min(10).max(40),
  responses: z.array(z.object({
    questionId: z.string().min(1).max(60),
    score: z.number().int().min(1).max(5),
  })).min(1).max(MAX_PHASE2_RESPONSES),
})
