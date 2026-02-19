import { z } from 'zod'

// Form schema: stores profile fields as raw strings for textarea/input compatibility.
// Required fields use min(1) validation; optional text fields are plain strings
// (empty string = omitted from the API payload).
export const IntentFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  examplesText: z.string(),
  keywordsText: z.string(),
  enabled: z.boolean(),
  profileModel: z.string(),
  profileTemp: z.string(),
  profileMaxToolCalls: z.string(),
  profileAllowedTools: z.string(),
  profileSystemPrompt: z.string(),
  profileResponseFormat: z.string(),
})

export type IntentFormInput = z.infer<typeof IntentFormSchema>
