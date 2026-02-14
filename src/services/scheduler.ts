import type {
  CreateScheduledJobRequest,
  ScheduledJobResponse,
  UpdateScheduledJobRequest,
} from '../types/api'
import { API_BASE } from '../utils/constants'
import { fetchWithAuth } from '../utils/api-client'

const BASE = `${API_BASE}/api/scheduler/jobs`

export async function listScheduledJobs(): Promise<ScheduledJobResponse[]> {
  const res = await fetchWithAuth(BASE)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getScheduledJob(id: string): Promise<ScheduledJobResponse> {
  const res = await fetchWithAuth(`${BASE}/${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createScheduledJob(request: CreateScheduledJobRequest): Promise<ScheduledJobResponse> {
  const res = await fetchWithAuth(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function updateScheduledJob(id: string, request: UpdateScheduledJobRequest): Promise<ScheduledJobResponse> {
  const res = await fetchWithAuth(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteScheduledJob(id: string): Promise<void> {
  const res = await fetchWithAuth(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`)
}

export async function triggerScheduledJob(id: string): Promise<{ result: string }> {
  const res = await fetchWithAuth(`${BASE}/${encodeURIComponent(id)}/trigger`, { method: 'POST' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data && data.error) || `HTTP ${res.status}`)
  return data
}

