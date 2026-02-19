import { useQuery } from '@tanstack/react-query'
import { listMcpServers } from '../services/mcp'
import { queryKeys } from '../lib/queryKeys'

export function useMcpServers() {
  return useQuery({
    queryKey: queryKeys.mcpServers.list(),
    queryFn: listMcpServers,
  })
}
