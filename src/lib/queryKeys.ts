export const queryKeys = {
  personas: {
    all: () => ['personas'] as const,
    list: () => ['personas', 'list'] as const,
    detail: (id: string) => ['personas', 'detail', id] as const,
  },
  intents: {
    all: () => ['intents'] as const,
    list: () => ['intents', 'list'] as const,
  },
  mcpServers: {
    all: () => ['mcpServers'] as const,
    list: () => ['mcpServers', 'list'] as const,
    detail: (name: string) => ['mcpServers', 'detail', name] as const,
    accessPolicy: (name: string) => ['mcpServers', 'accessPolicy', name] as const,
  },
  outputGuard: {
    all: () => ['outputGuard'] as const,
    list: () => ['outputGuard', 'list'] as const,
    audits: () => ['outputGuard', 'audits'] as const,
  },
  toolPolicy: {
    all: () => ['toolPolicy'] as const,
    state: () => ['toolPolicy', 'state'] as const,
  },
  scheduler: {
    all: () => ['scheduler'] as const,
    list: () => ['scheduler', 'list'] as const,
  },
  approval: {
    all: () => ['approval'] as const,
    list: () => ['approval', 'list'] as const,
  },
}
