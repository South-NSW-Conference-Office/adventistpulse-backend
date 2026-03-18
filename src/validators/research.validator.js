import { z } from 'zod'

export const researchListQuerySchema = z.object({
  page:     z.string().regex(/^\d+$/).optional(),
  limit:    z.string().regex(/^\d+$/).optional(),
  status:   z.string().max(50).optional(),
  tag:      z.string().max(100).optional(),
  featured: z.enum(['true', 'false']).optional(),
  search:   z.string().max(200).optional(),
}).strict()
