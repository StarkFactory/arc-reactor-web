export const queryKeys = {
  personas: {
    all: () => ['personas'] as const,
    list: () => ['personas', 'list'] as const,
  },
  intents: {
    all: () => ['intents'] as const,
    list: () => ['intents', 'list'] as const,
    detail: (name: string) => ['intents', 'detail', name] as const,
  },
  mcpServers: {
    all: () => ['mcp-servers'] as const,
    list: () => ['mcp-servers', 'list'] as const,
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
} as const
