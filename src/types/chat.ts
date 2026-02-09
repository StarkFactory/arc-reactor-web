export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: string[]
  error?: boolean
  errorCode?: string
  timestamp: number
  durationMs?: number
}

export interface Session {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}

export interface ChatSettings {
  model: string | null
  systemPrompt: string
  selectedPersonaId: string | null
  selectedPromptTemplateId: string | null
  responseFormat: 'TEXT' | 'JSON'
  darkMode: boolean
  showMetadata: boolean
  sidebarOpen: boolean
}
