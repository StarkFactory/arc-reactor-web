export interface ChatRequest {
  message: string
  model?: string
  systemPrompt?: string
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
