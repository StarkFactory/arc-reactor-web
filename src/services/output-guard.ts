import type {
  OutputGuardRuleResponse,
  CreateOutputGuardRuleRequest,
  UpdateOutputGuardRuleRequest,
  OutputGuardSimulationRequest,
  OutputGuardSimulationResponse,
  OutputGuardRuleAuditResponse,
} from '../types/api'
import { API_BASE } from '../utils/constants'
import { fetchWithAuth } from '../utils/api-client'

const BASE = `${API_BASE}/api/output-guard/rules`

export async function listOutputGuardRules(): Promise<OutputGuardRuleResponse[]> {
  const res = await fetchWithAuth(BASE)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createOutputGuardRule(request: CreateOutputGuardRuleRequest): Promise<OutputGuardRuleResponse> {
  const res = await fetchWithAuth(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function updateOutputGuardRule(id: string, request: UpdateOutputGuardRuleRequest): Promise<void> {
  const res = await fetchWithAuth(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function deleteOutputGuardRule(id: string): Promise<void> {
  const res = await fetchWithAuth(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function simulateOutputGuard(request: OutputGuardSimulationRequest): Promise<OutputGuardSimulationResponse> {
  const res = await fetchWithAuth(`${BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function listOutputGuardAudits(limit = 100): Promise<OutputGuardRuleAuditResponse[]> {
  const res = await fetchWithAuth(`${BASE}/audits?limit=${limit}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
