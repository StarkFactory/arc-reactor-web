import type {
  OutputGuardRuleResponse,
  CreateOutputGuardRuleRequest,
  UpdateOutputGuardRuleRequest,
  OutputGuardSimulationRequest,
  OutputGuardSimulationResponse,
  OutputGuardRuleAuditResponse,
} from '../types/api'
import { api } from '../lib/http'

export const listOutputGuardRules = (): Promise<OutputGuardRuleResponse[]> =>
  api.get('output-guard/rules').json()

export const createOutputGuardRule = (request: CreateOutputGuardRuleRequest): Promise<OutputGuardRuleResponse> =>
  api.post('output-guard/rules', { json: request }).json()

export const updateOutputGuardRule = (id: string, request: UpdateOutputGuardRuleRequest): Promise<void> =>
  api.put(`output-guard/rules/${encodeURIComponent(id)}`, { json: request }).then(() => undefined)

export const deleteOutputGuardRule = (id: string): Promise<void> =>
  api.delete(`output-guard/rules/${encodeURIComponent(id)}`).then(() => undefined)

export const simulateOutputGuard = (request: OutputGuardSimulationRequest): Promise<OutputGuardSimulationResponse> =>
  api.post('output-guard/rules/simulate', { json: request }).json()

export const listOutputGuardAudits = (limit = 100): Promise<OutputGuardRuleAuditResponse[]> =>
  api.get(`output-guard/rules/audits?limit=${limit}`).json()
