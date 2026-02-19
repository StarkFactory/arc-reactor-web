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
