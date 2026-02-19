import { z } from 'zod'

export const OutputGuardFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  pattern: z.string().min(1, 'Pattern is required'),
  action: z.string(),
  priority: z.string(),
  enabled: z.boolean(),
})

export type OutputGuardFormInput = z.infer<typeof OutputGuardFormSchema>

export const EMPTY_OUTPUT_GUARD_FORM: OutputGuardFormInput = {
  name: '',
  pattern: '',
  action: 'MASK',
  priority: '100',
  enabled: true,
}

export const OutputGuardRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  pattern: z.string(),
  action: z.string(),
  priority: z.number().int(),
  enabled: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const CreateOutputGuardRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  pattern: z.string().min(1, 'Pattern is required'),
  action: z.string().optional(),
  priority: z.number().int().optional(),
  enabled: z.boolean().optional(),
})

export const UpdateOutputGuardRuleSchema = z.object({
  name: z.string().min(1).optional(),
  pattern: z.string().min(1).optional(),
  action: z.string().optional(),
  priority: z.number().int().optional(),
  enabled: z.boolean().optional(),
})

export type OutputGuardRule = z.infer<typeof OutputGuardRuleSchema>
export type CreateOutputGuardRuleInput = z.infer<typeof CreateOutputGuardRuleSchema>
export type UpdateOutputGuardRuleInput = z.infer<typeof UpdateOutputGuardRuleSchema>
