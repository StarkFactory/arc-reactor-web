import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchOpsDashboard } from '../services/ops-dashboard'

export function useOpsDashboard() {
  return useQuery({
    queryKey: queryKeys.opsDashboard.metrics(),
    queryFn: fetchOpsDashboard,
    staleTime: 1000 * 30, // 30s — ops metrics refresh frequently
    retry: false,
  })
}
