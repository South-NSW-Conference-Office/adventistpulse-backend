import { z } from 'zod'

export const nominateSchema = z.object({
  name:             z.string().min(2).max(100),
  email:            z.string().email(),
  role:             z.enum(['member', 'elder', 'pastor', 'editor', 'admin']),
  memberChurch:     z.string().toUpperCase().max(50).optional().nullable(),
  assignedChurches: z.array(z.string().toUpperCase().max(50)).default([]),
  // conferenceCode intentionally omitted — always pinned to req.user.subscription.conferenceCode
  paidBy:           z.enum(['conference', 'self']).default('conference'),
})

export const acceptInviteSchema = z.object({
  token:    z.string().length(64).regex(/^[0-9a-f]+$/i, 'Invalid token format'),
  password: z.string().min(8).max(128),
})

export const delegateSchema = z.object({
  elderEmail: z.string().email(),
  churchCode: z.string().toUpperCase().max(50),
  expiresAt:  z.string().datetime().optional().nullable(),
})

export const assignmentSchema = z.object({
  personName: z.string().min(2).max(100),
  churchCode: z.string().toUpperCase().max(50),
  role:       z.enum(['head-pastor', 'associate-pastor', 'bible-worker', 'chaplain', 'elder', 'district-leader']).default('head-pastor'),
  startDate:  z.string().datetime(),
  endDate:    z.string().datetime().optional().nullable(),
  // conferenceCode intentionally omitted — always pinned to req.user.subscription.conferenceCode
  notes:      z.string().max(500).optional().nullable(),
})
