import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Do not retry on 4xx client errors
        if (error instanceof Error && 'response' in error) {
          const status = (error as { response?: { status?: number } }).response?.status
          if (status !== undefined && status >= 400 && status < 500) return false
        }
        return failureCount < 2
      },
    },
  },
})
