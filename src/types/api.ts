export interface ChatRequest {
  message: string
  model?: string
  systemPrompt?: string
  personaId?: string
  userId?: string
  metadata?: Record<string, unknown>
  responseFormat?: 'TEXT' | 'JSON'
  responseSchema?: string
}

export interface ChatResponse {
  content: string | null
  success: boolean
  model?: string
  toolsUsed: string[]
  errorMessage?: string
}

export interface PersonaResponse {
  id: string
  name: string
  systemPrompt: string
  isDefault: boolean
  createdAt: number
  updatedAt: number
}

export interface CreatePersonaRequest {
  name: string
  systemPrompt: string
  isDefault?: boolean
}

export interface UpdatePersonaRequest {
  name?: string
  systemPrompt?: string
  isDefault?: boolean
}
