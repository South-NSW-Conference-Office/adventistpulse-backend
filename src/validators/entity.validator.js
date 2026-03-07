import { z } from 'zod'

const LEVELS = ['gc', 'division', 'union', 'conference', 'church']

export const createEntitySchema = z.object({
  code: z.string().min(2).max(20).toUpperCase(),
  name: z.string().min(2).max(200),
  level: z.enum(LEVELS),
  parentCode: z.string().toUpperCase().optional().nullable(),
  metadata: z.object({
    region: z.string().optional(),
    country: z.string().optional(),
    established: z.number().int().min(1800).max(2100).optional(),
    website: z.string().url().optional().nullable(),
  }).optional(),
})

export const updateEntitySchema = createEntitySchema.partial().omit({ code: true })

export const entityQuerySchema = z.object({
  level: z.enum(LEVELS).optional(),
  parentCode: z.string().toUpperCase().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})
