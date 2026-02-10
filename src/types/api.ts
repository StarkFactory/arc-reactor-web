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

// ---- MCP Server Types ----

export interface McpServerResponse {
  id: string
  name: string
  description: string | null
  transportType: string
  autoConnect: boolean
  status: string
  toolCount: number
  createdAt: number
  updatedAt: number
}

export interface McpServerDetailResponse {
  id: string
  name: string
  description: string | null
  transportType: string
  config: Record<string, unknown>
  version: string | null
  autoConnect: boolean
  status: string
  tools: string[]
  createdAt: number
  updatedAt: number
}

export interface RegisterMcpServerRequest {
  name: string
  description?: string
  transportType: string
  config: Record<string, unknown>
  autoConnect?: boolean
}

export interface UpdateMcpServerRequest {
  description?: string
  transportType?: string
  config?: Record<string, unknown>
  autoConnect?: boolean
}

export interface McpConnectResponse {
  status: string
  tools?: string[]
  error?: string
}

// ---- Approval Types (Human-in-the-Loop) ----

export interface ApprovalSummary {
  id: string
  runId: string
  userId: string
  toolName: string
  arguments: Record<string, unknown>
  requestedAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'TIMED_OUT'
}

export interface ApprovalActionResponse {
  success: boolean
  message: string
}
