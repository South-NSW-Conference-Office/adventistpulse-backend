import { z } from 'zod'

export const reportListQuerySchema = z.object({
  page:       z.string().regex(/^\d+$/).optional(),
  limit:      z.string().regex(/^\d+$/).optional(),
  type:       z.string().max(50).optional(),
  year:       z.string().regex(/^\d{4}$/).optional(),
  entityCode: z.string().max(50).optional(),
  featured:   z.enum(['true', 'false']).optional(),
}).strict()
