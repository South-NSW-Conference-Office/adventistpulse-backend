import { z } from 'zod'

const CHURCH_ROLES = [
  'member', 'deacon', 'deaconess', 'elder', 'pastor',
  'bible_worker', 'local_church_officer', 'conference_officer',
  'union_officer', 'division_officer', 'gc_officer', 'other',
]

export const onboardingSubmitSchema = z.object({
  phone:            z.string().trim().optional().nullable(),
  country:          z.string().trim().min(2, 'Country is required').max(100),
  division:         z.string().trim().min(2, 'Division is required').max(150),
  union:            z.string().trim().min(2, 'Union is required').max(150),
  conference:       z.string().trim().min(2, 'Conference is required').max(150),
  localChurch:      z.string().trim().min(2, 'Local church is required').max(200),
  churchRole:       z.enum(CHURCH_ROLES, { errorMap: () => ({ message: 'Please select a valid church role' }) }),
  roleDescription:  z.string().trim().max(200).optional().nullable(),
  purposeStatement: z.string().trim().min(20, 'Please write at least 20 characters explaining your purpose').max(1000),
})

export const approvalActionSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
})
