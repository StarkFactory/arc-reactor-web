export interface ChatRequest {
  message: string
  model?: string
  systemPrompt?: string
  personaId?: string
  promptTemplateId?: string
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

// --- Prompt Template Types ---

export type VersionStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

export interface TemplateResponse {
  id: string
  name: string
  description: string
  createdAt: number
  updatedAt: number
}

export interface TemplateDetailResponse {
  id: string
  name: string
  description: string
  activeVersion: VersionResponse | null
  versions: VersionResponse[]
  createdAt: number
  updatedAt: number
}

export interface VersionResponse {
  id: string
  templateId: string
  version: number
  content: string
  status: VersionStatus
  changeLog: string
  createdAt: number
}

export interface CreateTemplateRequest {
  name: string
  description?: string
}

export interface UpdateTemplateRequest {
  name?: string
  description?: string
}

export interface CreateVersionRequest {
  content: string
  changeLog?: string
}
