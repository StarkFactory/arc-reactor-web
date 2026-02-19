import { api } from '../lib/http'
import type { OpsDashboardResponse } from '../types/api'

export function fetchOpsDashboard(): Promise<OpsDashboardResponse> {
  return api.get('ops/dashboard').json()
}
