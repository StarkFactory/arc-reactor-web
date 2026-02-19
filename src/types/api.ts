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

export interface McpAccessPolicyResponse {
  ok: boolean
  dynamicEnabled?: boolean
  allowedJiraProjectKeys: string[]
  allowedConfluenceSpaceKeys: string[]
}

export interface UpdateMcpAccessPolicyRequest {
  allowedJiraProjectKeys: string[]
  allowedConfluenceSpaceKeys: string[]
}

// ---- Error Report Types ----

export interface ErrorReportRequest {
  stackTrace: string
  serviceName: string
  repoSlug: string
  slackChannel: string
  environment?: string
}

export interface ErrorReportResponse {
  accepted: boolean
  requestId: string
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


// ---- Intent Types ----

export type IntentResponseFormat = 'TEXT' | 'JSON' | 'YAML'

export interface IntentProfile {
  model: string | null
  temperature: number | null
  maxToolCalls: number | null
  allowedTools: string[] | null
  systemPrompt: string | null
  responseFormat: IntentResponseFormat | null
}

export interface IntentResponse {
  name: string
  description: string
  examples: string[]
  keywords: string[]
  profile: IntentProfile
  enabled: boolean
  createdAt: number
  updatedAt: number
}

export interface CreateIntentRequest {
  name: string
  description: string
  examples?: string[]
  keywords?: string[]
  profile?: IntentProfile
  enabled?: boolean
}

export interface UpdateIntentRequest {
  description?: string
  examples?: string[]
  keywords?: string[]
  profile?: IntentProfile
  enabled?: boolean
}

// ---- Output Guard Types ----

export interface OutputGuardRuleResponse {
  id: string
  name: string
  pattern: string
  action: string
  priority: number
  enabled: boolean
  createdAt: number
  updatedAt: number
}

export interface CreateOutputGuardRuleRequest {
  name: string
  pattern: string
  action?: string
  priority?: number
  enabled?: boolean
}

export interface UpdateOutputGuardRuleRequest {
  name?: string
  pattern?: string
  action?: string
  priority?: number
  enabled?: boolean
}

export interface OutputGuardSimulationRequest {
  content: string
  includeDisabled?: boolean
}

export interface OutputGuardSimulationMatchResponse {
  ruleId: string
  ruleName: string
  action: string
  priority: number
}

export interface OutputGuardSimulationInvalidRuleResponse {
  ruleId: string
  ruleName: string
  reason: string
}

export interface OutputGuardSimulationResponse {
  originalContent: string
  resultContent: string
  blocked: boolean
  modified: boolean
  blockedByRuleId: string | null
  blockedByRuleName: string | null
  matchedRules: OutputGuardSimulationMatchResponse[]
  invalidRules: OutputGuardSimulationInvalidRuleResponse[]
}

export interface OutputGuardRuleAuditResponse {
  id: string
  ruleId: string | null
  action: string
  actor: string
  detail: string | null
  createdAt: number
}


// ---- Tool Policy Types ----

export interface ToolPolicyResponse {
  enabled: boolean
  writeToolNames: string[]
  denyWriteChannels: string[]
  allowWriteToolNamesInDenyChannels: string[]
  allowWriteToolNamesByChannel: Record<string, string[]>
  denyWriteMessage: string
  createdAt: number
  updatedAt: number
}

export interface ToolPolicyStateResponse {
  configEnabled: boolean
  dynamicEnabled: boolean
  effective: ToolPolicyResponse
  stored: ToolPolicyResponse | null
}

export interface UpdateToolPolicyRequest {
  enabled: boolean
  writeToolNames: string[]
  denyWriteChannels: string[]
  allowWriteToolNamesInDenyChannels: string[]
  allowWriteToolNamesByChannel: Record<string, string[]>
  denyWriteMessage: string
}

// ---- Ops Dashboard Types ----

export interface SchedulerJobSummary {
  successCount: number
  failedCount: number
  disabledCount: number
}

export interface OpsDashboardResponse {
  totalChats: number
  activeUsers: number
  successRate: number
  avgLatencyMs: number
  schedulerJobSummary: SchedulerJobSummary
  recentAuditLogs: AdminAuditLogResponse[]
}

// ---- Admin Audit Log Types ----

export interface AdminAuditLogResponse {
  id: string
  category: string
  action: string
  actor: string
  resourceId: string | null
  detail: Record<string, unknown> | null
  createdAt: number
}

export interface AuditLogsPageResponse {
  content: AdminAuditLogResponse[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface AuditLogsParams {
  page?: number
  size?: number
  category?: string
  actor?: string
  from?: string
  to?: string
}

// ---- Admin User Types ----

export type UserRole = 'USER' | 'ADMIN'

export interface AdminUserResponse {
  id: string
  email: string
  name: string
  role: UserRole
  active: boolean
  createdAt: number
}

export interface AdminUserListResponse {
  content: AdminUserResponse[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface AdminUserListParams {
  page?: number
  size?: number
  search?: string
  role?: string
  status?: string
}

export interface UpdateUserRoleRequest {
  role: UserRole
}

export interface UpdateUserStatusRequest {
  active: boolean
}

export interface ResetPasswordResponse {
  temporaryPassword: string
}

// ---- Scheduler Types ----

export interface ScheduledJobResponse {
  id: string
  name: string
  description: string | null
  cronExpression: string
  timezone: string
  mcpServerName: string
  toolName: string
  toolArguments: Record<string, unknown>
  slackChannelId: string | null
  enabled: boolean
  lastRunAt: number | null
  lastStatus: string | null
  lastResult: string | null
  createdAt: number
  updatedAt: number
}

export interface CreateScheduledJobRequest {
  name: string
  description?: string | null
  cronExpression: string
  timezone?: string
  mcpServerName: string
  toolName: string
  toolArguments?: Record<string, unknown>
  slackChannelId?: string | null
  enabled?: boolean
}

export interface UpdateScheduledJobRequest {
  name: string
  description?: string | null
  cronExpression: string
  timezone?: string
  mcpServerName: string
  toolName: string
  toolArguments?: Record<string, unknown>
  slackChannelId?: string | null
  enabled?: boolean
}
