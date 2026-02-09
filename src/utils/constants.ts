export const API_BASE = import.meta.env.VITE_API_URL || ''

export const FRAMES_TARGET = 40

export const MAX_SESSIONS = 50
export const SESSION_TITLE_MAX_LENGTH = 30

export const AVAILABLE_MODELS = [
  { id: '', labelKey: 'model.default', label: 'Default (Server)', provider: '' },
  { id: 'gemini', labelKey: '', label: 'Gemini', provider: 'Google' },
  { id: 'openai', labelKey: '', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'anthropic', labelKey: '', label: 'Claude', provider: 'Anthropic' },
] as const

export const DEFAULT_SETTINGS = {
  model: null as string | null,
  systemPrompt: '',
  selectedPersonaId: null as string | null,
  selectedPromptTemplateId: null as string | null,
  responseFormat: 'TEXT' as const,
  darkMode: true,
  showMetadata: false,
  sidebarOpen: true,
}

// Error code to i18n key mapping
export const ERROR_CODE_KEYS: Record<string, string> = {
  RATE_LIMITED: 'error.rateLimited',
  TIMEOUT: 'error.timeout',
  CONTEXT_TOO_LONG: 'error.contextTooLong',
  TOOL_ERROR: 'error.toolError',
  GUARD_REJECTED: 'error.guardRejected',
  HOOK_REJECTED: 'error.hookRejected',
}

export const HTTP_ERROR_KEYS: Record<number, string> = {
  429: 'error.http429',
  502: 'error.http502',
  503: 'error.http503',
  504: 'error.http504',
}
