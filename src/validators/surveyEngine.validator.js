import { z } from 'zod'

/** Valid question types */
const questionTypeEnum = z.enum(['likert', 'yesno', 'multiplechoice', 'text', 'nps', 'ranking'])

/** Single question shape */
const questionSchema = z.object({
  questionId: z.string().min(1).max(40),
  text:       z.string().min(3).max(300),
  type:       questionTypeEnum,
  options:    z.array(z.string().max(120)).optional().default([]),
  scale: z.object({
    min:      z.number().int().default(1),
    max:      z.number().int().default(5),
    minLabel: z.string().max(40).default(''),
    maxLabel: z.string().max(40).default(''),
  }).optional().default({}),
  required: z.boolean().default(true),
  order:    z.number().int().min(0),
})

/** Create / update survey body */
export const createSurveySchema = z.object({
  title:       z.string().min(3).max(120),
  description: z.string().max(500).optional().default(''),
  questions:   z.array(questionSchema).max(15).optional().default([]),
  template:    z.string().max(60).optional().default(null),
  settings: z.object({
    anonymous:    z.boolean().optional().default(true),
    closeDate:    z.string().datetime().optional().nullable().default(null),
    maxResponses: z.number().int().positive().optional().nullable().default(null),
  }).optional().default({}),
})

/** Publish survey — sets targeting */
export const publishSurveySchema = z.object({
  targeting: z.object({
    scope:          z.enum(['church', 'conference', 'union']),
    churchCodes:    z.array(z.string().toUpperCase()).optional().default([]),
    conferenceCode: z.string().toUpperCase().optional().nullable().default(null),
    unionCode:      z.string().toUpperCase().optional().nullable().default(null),
  }),
  settings: z.object({
    closeDate:    z.string().datetime().optional().nullable().default(null),
    maxResponses: z.number().int().positive().optional().nullable().default(null),
  }).optional().default({}),
})

/** AI generate questions from plain-language intent */
export const aiGenerateSchema = z.object({
  intent:        z.string().min(10).max(500),
  questionCount: z.number().int().min(3).max(15).optional().default(8),
})

/** AI review a single question */
export const aiReviewSchema = z.object({
  question: z.string().min(3).max(300),
  type:     questionTypeEnum.optional(),
})

/** Submit a response to a custom survey */
export const submitEngineResponseSchema = z.object({
  sessionCode:  z.string().min(4).max(20).toUpperCase(),
  dedupeToken:  z.string().min(8).max(64),
  answers:      z.record(z.string(), z.union([
    z.string(),
    z.number(),
    z.array(z.string()),
  ])),
})
