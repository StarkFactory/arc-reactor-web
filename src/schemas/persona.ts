import { z } from 'zod'

export const PersonaSchema = z.object({
  id: z.string(),
  name: z.string(),
  systemPrompt: z.string(),
  isDefault: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const CreatePersonaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  systemPrompt: z.string().min(1, 'System prompt is required'),
  isDefault: z.boolean().optional(),
})

export const UpdatePersonaSchema = z.object({
  name: z.string().min(1).optional(),
  systemPrompt: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
})

export type Persona = z.infer<typeof PersonaSchema>
export type CreatePersonaInput = z.infer<typeof CreatePersonaSchema>
export type UpdatePersonaInput = z.infer<typeof UpdatePersonaSchema>
