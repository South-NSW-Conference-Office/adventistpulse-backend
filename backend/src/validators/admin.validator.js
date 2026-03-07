import { z } from 'zod'

export const setActiveSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive (boolean) is required' }),
})

export const updateRoleSchema = z.object({
  role:         z.enum(['admin', 'editor', 'viewer']).optional(),
  entityAccess: z.array(z.string()).optional(),
}).refine(d => d.role || d.entityAccess, {
  message: 'Provide at least one of: role, entityAccess',
})
