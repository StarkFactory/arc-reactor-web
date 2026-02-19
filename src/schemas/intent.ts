import { z } from 'zod'

const IntentResponseFormatSchema = z.enum(['TEXT', 'JSON', 'YAML'])

export const IntentProfileSchema = z.object({
  model: z.string().nullable(),
  temperature: z.number().nullable(),
  maxToolCalls: z.number().int().nullable(),
  allowedTools: z.array(z.string()).nullable(),
  systemPrompt: z.string().nullable(),
  responseFormat: IntentResponseFormatSchema.nullable(),
})

export const IntentSchema = z.object({
  name: z.string(),
  description: z.string(),
  examples: z.array(z.string()),
  keywords: z.array(z.string()),
  profile: IntentProfileSchema,
  enabled: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const CreateIntentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  examples: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  profile: IntentProfileSchema.optional(),
  enabled: z.boolean().optional(),
})

export const UpdateIntentSchema = z.object({
  description: z.string().min(1).optional(),
  examples: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  profile: IntentProfileSchema.optional(),
  enabled: z.boolean().optional(),
})

export type IntentProfile = z.infer<typeof IntentProfileSchema>
export type Intent = z.infer<typeof IntentSchema>
export type CreateIntentInput = z.infer<typeof CreateIntentSchema>
export type UpdateIntentInput = z.infer<typeof UpdateIntentSchema>
