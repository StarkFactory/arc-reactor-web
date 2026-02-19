export const queryKeys = {
  personas: {
    all: () => ['personas'] as const,
    list: () => ['personas', 'list'] as const,
    detail: (id: string) => ['personas', 'detail', id] as const,
  },
  intents: {
    all: () => ['intents'] as const,
    list: () => ['intents', 'list'] as const,
    detail: (name: string) => ['intents', 'detail', name] as const,
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
  opsDashboard: {
    all: () => ['opsDashboard'] as const,
    metrics: () => ['opsDashboard', 'metrics'] as const,
  },
  auditLogs: {
    all: () => ['auditLogs'] as const,
    list: (params: Record<string, unknown>) => ['auditLogs', 'list', params] as const,
  },
  users: {
    all: () => ['users'] as const,
    list: (params: Record<string, unknown>) => ['users', 'list', params] as const,
  },
  approval: {
    all: () => ['approval'] as const,
    list: () => ['approval', 'list'] as const,
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
    all: () => ['errorReports'] as const,
    list: () => ['errorReports', 'list'] as const,
  },
}
