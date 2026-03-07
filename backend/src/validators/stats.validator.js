import { z } from 'zod'

const membershipSchema = z.object({
  beginning: z.number().int().min(0).optional(),
  ending: z.number().int().min(0).optional(),
  baptisms: z.number().int().min(0).optional(),
  professionOfFaith: z.number().int().min(0).optional(),
  transfersIn: z.number().int().min(0).optional(),
  transfersOut: z.number().int().min(0).optional(),
  deaths: z.number().int().min(0).optional(),
  dropped: z.number().int().min(0).optional(),
  missing: z.number().int().min(0).optional(),
})

const workersSchema = z.object({
  ordainedMinisters: z.number().int().min(0).optional(),
  licensedMinisters: z.number().int().min(0).optional(),
  licensedMissionaries: z.number().int().min(0).optional(),
  literatureEvangelists: z.number().int().min(0).optional(),
  totalWorkers: z.number().int().min(0).optional(),
})

const financeSchema = z.object({
  tithe: z.number().min(0).optional(),
  titheCurrency: z.string().length(3).default('USD'),
  offerings: z.number().min(0).optional(),
})

export const createStatSchema = z.object({
  entityCode: z.string().min(1).toUpperCase(),
  year: z.number().int().min(1863).max(new Date().getFullYear()),
  churches: z.number().int().min(0).optional(),
  companies: z.number().int().min(0).optional(),
  membership: membershipSchema.optional(),
  workers: workersSchema.optional(),
  finance: financeSchema.optional(),
  source: z.enum(['adventiststatistics.org', 'manual', 'session_report']).default('manual'),
  sourceUrl: z.string().url().optional().nullable(),
  verified: z.boolean().default(false),
})

export const importStatsSchema = z.object({
  entityCode: z.string().min(1).toUpperCase(),
  stats: z.array(createStatSchema.omit({ entityCode: true })).min(1),
})

export const statsQuerySchema = z.object({
  from: z.string().optional().transform(v => v ? parseInt(v) : undefined),
  to: z.string().optional().transform(v => v ? parseInt(v) : undefined),
})

export const rankingsQuerySchema = z.object({
  level: z.enum(['gc', 'division', 'union', 'conference', 'church']),
  metric: z.enum(['baptisms', 'growth_rate', 'tithe_per_member', 'retention']),
  year: z.string().transform(Number),
  parentCode: z.string().toUpperCase().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})
