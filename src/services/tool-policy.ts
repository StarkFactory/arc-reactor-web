import type {
  ToolPolicyStateResponse,
  ToolPolicyResponse,
  UpdateToolPolicyRequest,
} from '../types/api'
import { api } from '../lib/http'

export const getToolPolicy = (): Promise<ToolPolicyStateResponse> =>
  api.get('tool-policy').json()

export const updateToolPolicy = (request: UpdateToolPolicyRequest): Promise<ToolPolicyResponse> =>
  api.put('tool-policy', { json: request }).json()

// ky treats 204 No Content as a successful response, so no special handling is needed.
export const deleteToolPolicy = (): Promise<void> =>
  api.delete('tool-policy').then(() => undefined)
