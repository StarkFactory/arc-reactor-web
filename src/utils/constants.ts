export const API_BASE = import.meta.env.VITE_API_URL || ''

export const FRAMES_TARGET = 40

export const MAX_SESSIONS = 50
export const SESSION_TITLE_MAX_LENGTH = 30

export const AVAILABLE_MODELS = [
  { id: '', label: '기본값 (서버)', provider: '' },
  { id: 'gemini', label: 'Gemini', provider: 'Google' },
  { id: 'openai', label: 'GPT-4o', provider: 'OpenAI' },
  { id: 'anthropic', label: 'Claude', provider: 'Anthropic' },
] as const

export const DEFAULT_SETTINGS = {
  model: null as string | null,
  systemPrompt: '',
  selectedPersonaId: null as string | null,
  responseFormat: 'TEXT' as const,
  darkMode: true,
  showMetadata: false,
  sidebarOpen: true,
}

export const SUGGESTIONS = ['안녕하세요', '지금 몇 시야?', '3 + 5는 얼마야?']

export const ERROR_MESSAGES: Record<string, string> = {
  RATE_LIMITED: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  TIMEOUT: '요청 시간이 초과되었습니다.',
  CONTEXT_TOO_LONG: '입력이 너무 깁니다. 내용을 줄여주세요.',
  TOOL_ERROR: '도구 실행 중 오류가 발생했습니다.',
  GUARD_REJECTED: '요청이 거부되었습니다.',
  HOOK_REJECTED: '요청이 거부되었습니다.',
}

export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  429: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
  502: '서버에 연결할 수 없습니다.',
  503: '서버가 일시적으로 사용할 수 없습니다.',
  504: '서버 응답 시간이 초과되었습니다.',
}
