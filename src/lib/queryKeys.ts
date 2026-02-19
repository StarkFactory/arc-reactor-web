/**
 * Centralised query key factory.
 * Each domain exposes typed key creators so keys stay consistent
 * across useQuery calls and manual cache invalidations.
 */
export const queryKeys = {
  personas: {
    all: () => ['personas'] as const,
    list: () => ['personas', 'list'] as const,
    detail: (id: string) => ['personas', 'detail', id] as const,
  },
  intents: {
    all: () => ['intents'] as const,
    list: () => ['intents', 'list'] as const,
    detail: (id: string) => ['intents', 'detail', id] as const,
  },
  mcpServers: {
    all: () => ['mcp-servers'] as const,
    list: () => ['mcp-servers', 'list'] as const,
    detail: (id: string) => ['mcp-servers', 'detail', id] as const,
  },
  mcpAccessPolicy: {
    all: () => ['mcp-access-policy'] as const,
    list: () => ['mcp-access-policy', 'list'] as const,
  },
  outputGuard: {
    all: () => ['output-guard'] as const,
    list: () => ['output-guard', 'list'] as const,
  },
  toolPolicy: {
    all: () => ['tool-policy'] as const,
    list: () => ['tool-policy', 'list'] as const,
  },
  scheduler: {
    all: () => ['scheduler'] as const,
    jobs: () => ['scheduler', 'jobs'] as const,
  },
  approval: {
    all: () => ['approval'] as const,
    pending: () => ['approval', 'pending'] as const,
  },
  clipping: {
    all: () => ['clipping'] as const,
    stats: (yearMonth: string, categoryId?: string) =>
      ['clipping', 'stats', yearMonth, categoryId] as const,
    categories: () => ['clipping', 'categories'] as const,
  },
  prompts: {
    all: () => ['prompts'] as const,
    list: () => ['prompts', 'list'] as const,
    detail: (id: string) => ['prompts', 'detail', id] as const,
  },
  errorReports: {
    all: () => ['error-reports'] as const,
    list: () => ['error-reports', 'list'] as const,
  },
} as const
