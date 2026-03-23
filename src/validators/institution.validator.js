import { z } from 'zod'

const INSTITUTION_TYPES = ['education', 'health', 'humanitarian', 'media', 'food', 'publishing']

const trajectoryDataPointSchema = z.object({
  year:  z.number().int().min(1800).max(2100),
  value: z.number(),
})

const trajectoryItemSchema = z.object({
  metric:     z.string().min(1).max(200),
  source:     z.string().min(1).max(500),
  unit:       z.string().min(1).max(100),
  color:      z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isEstimate: z.boolean().optional().default(true),
  data:       z.array(trajectoryDataPointSchema).min(1),
})

export const createInstitutionSchema = z.object({
  code:           z.string().min(2).max(50).toUpperCase(),
  name:           z.string().min(2).max(300).trim(),
  type:           z.enum(INSTITUTION_TYPES),
  country:        z.string().min(2).max(100).trim(),
  region:         z.string().min(2).max(200).trim(),
  conferenceCode: z.string().toUpperCase().optional().nullable(),
  yearFounded:    z.number().int().min(1800).max(2100).optional().nullable(),
  website:        z.string().url().optional().nullable(),
  description:    z.string().max(2000).optional(),
  stats:          z.record(z.union([z.string(), z.number()])).optional().default({}),
  tags:           z.array(z.string().trim()).optional().default([]),
  contextNote:    z.string().max(1000).optional().nullable(),
  trajectory:     z.array(trajectoryItemSchema).optional().default([]),
  acncAbn:        z.string().optional().nullable(),
  acncUrl:        z.string().url().optional().nullable(),
  dataVerified:   z.boolean().optional().default(false),
  dataSource:     z.string().max(500).optional().nullable(),
})

export const updateInstitutionSchema = createInstitutionSchema.partial().omit({ code: true })

export const institutionQuerySchema = z.object({
  type:           z.enum(INSTITUTION_TYPES).optional(),
  region:         z.string().optional(),
  country:        z.string().optional(),
  conferenceCode: z.string().toUpperCase().optional(),  // filter by linked conference/org unit
  q:              z.string().optional(),                // text search
  page:           z.coerce.number().int().min(1).optional().default(1),
  limit:          z.coerce.number().int().min(1).max(100).optional().default(50),
})

export const createACNCEntrySchema = z.object({
  institutionCode:    z.string().toUpperCase().optional().nullable(),
  name:               z.string().min(2).max(300).trim(),
  abn:                z.string().optional().nullable(),
  acncUrl:            z.string().url().optional().nullable(),
  type:               z.enum(['conference', 'institution', 'charity', 'school', 'hospital', 'media', 'other']),
  financialYear:      z.string().regex(/^\d{4}-\d{2}$/),  // "2022-23"
  totalRevenue:       z.number().positive().optional().nullable(),
  totalExpenses:      z.number().positive().optional().nullable(),
  totalAssets:        z.number().positive().optional().nullable(),
  netAssets:          z.number().optional().nullable(),
  programExpenditure: z.number().positive().optional().nullable(),
  adminExpenditure:   z.number().positive().optional().nullable(),
  notes:              z.string().max(2000).optional().nullable(),
  verified:           z.boolean().optional().default(false),
})

export const updateACNCEntrySchema = createACNCEntrySchema.partial().omit({ institutionCode: true })
