import Joi from 'joi'

export const nominateSchema = Joi.object({
  name:             Joi.string().min(2).max(100).required(),
  email:            Joi.string().email().required(),
  role:             Joi.string().valid('member', 'elder', 'pastor', 'editor', 'admin').required(),
  memberChurch:     Joi.string().uppercase().max(50).optional().allow(null, ''),
  assignedChurches: Joi.array().items(Joi.string().uppercase().max(50)).default([]),
  conferenceCode:   Joi.string().uppercase().max(20).optional(),
  paidBy:           Joi.string().valid('conference', 'self').default('conference'),
})

export const acceptInviteSchema = Joi.object({
  token:    Joi.string().hex().length(64).required(),
  password: Joi.string().min(8).max(128).required(),
})

export const delegateSchema = Joi.object({
  elderEmail: Joi.string().email().required(),
  churchCode: Joi.string().uppercase().max(50).required(),
  expiresAt:  Joi.date().iso().min('now').optional().allow(null),
})

export const assignmentSchema = Joi.object({
  personName:     Joi.string().min(2).max(100).required(),
  churchCode:     Joi.string().uppercase().max(50).required(),
  role:           Joi.string().valid('head-pastor','associate-pastor','bible-worker','chaplain','elder','district-leader').default('head-pastor'),
  startDate:      Joi.date().iso().required(),
  endDate:        Joi.date().iso().min(Joi.ref('startDate')).optional().allow(null),
  conferenceCode: Joi.string().uppercase().max(20).optional(),
  notes:          Joi.string().max(500).optional().allow(null, ''),
})
