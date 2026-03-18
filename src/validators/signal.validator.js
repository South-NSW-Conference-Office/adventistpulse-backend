import { z } from 'zod'
import { SIGNAL_TIERS } from '../models/Signal.js'

export const listSignalsSchema = z.object({
  tiers:    z.string().optional().transform(v =>
    v ? v.toUpperCase().split(',').filter(t => SIGNAL_TIERS.includes(t)) : []
  ),
  resolved: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  limit:    z.string().optional().transform(v => Math.min(parseInt(v ?? '100', 10) || 100, 500)),
})

export const resolveSignalSchema = z.object({
  note: z.string().max(500).optional().nullable(),
})
