import type { IntentResponse, CreateIntentRequest, UpdateIntentRequest } from '../types/api'
import { API_BASE } from '../utils/constants'
import { fetchWithAuth } from '../utils/api-client'

const BASE = `${API_BASE}/api/intents`

export async function listIntents(): Promise<IntentResponse[]> {
  const res = await fetchWithAuth(BASE)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getIntent(name: string): Promise<IntentResponse> {
  const res = await fetchWithAuth(`${BASE}/${encodeURIComponent(name)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createIntent(request: CreateIntentRequest): Promise<IntentResponse> {
  const res = await fetchWithAuth(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (res.status === 409) throw new Error('CONFLICT')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function updateIntent(name: string, request: UpdateIntentRequest): Promise<IntentResponse> {
  const res = await fetchWithAuth(`${BASE}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteIntent(name: string): Promise<void> {
  const res = await fetchWithAuth(`${BASE}/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
