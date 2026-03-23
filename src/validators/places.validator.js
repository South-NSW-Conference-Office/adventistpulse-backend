import { z } from 'zod'

export const churchPlacesQuerySchema = z.object({
  name:    z.string().min(1, 'name is required').max(200),
  lat:     z.coerce.number().optional(),
  lng:     z.coerce.number().optional(),
  address: z.string().max(500).optional(),
})
