import type {
  TemplateResponse,
  TemplateDetailResponse,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  VersionResponse,
  CreateVersionRequest,
} from '../types/api'
import { API_BASE } from '../utils/constants'
import { fetchWithAuth } from '../utils/api-client'

const BASE = `${API_BASE}/api/prompt-templates`

export async function listTemplates(): Promise<TemplateResponse[]> {
  const res = await fetchWithAuth(BASE)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getTemplate(id: string): Promise<TemplateDetailResponse> {
  const res = await fetchWithAuth(`${BASE}/${id}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createTemplate(request: CreateTemplateRequest): Promise<TemplateResponse> {
  const res = await fetchWithAuth(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function updateTemplate(
  id: string,
  request: UpdateTemplateRequest
): Promise<TemplateResponse> {
  const res = await fetchWithAuth(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteTemplate(id: string): Promise<void> {
  const res = await fetchWithAuth(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function createVersion(
  templateId: string,
  request: CreateVersionRequest
): Promise<VersionResponse> {
  const res = await fetchWithAuth(`${BASE}/${templateId}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function activateVersion(
  templateId: string,
  versionId: string
): Promise<VersionResponse> {
  const res = await fetchWithAuth(`${BASE}/${templateId}/versions/${versionId}/activate`, {
    method: 'PUT',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function archiveVersion(
  templateId: string,
  versionId: string
): Promise<VersionResponse> {
  const res = await fetchWithAuth(`${BASE}/${templateId}/versions/${versionId}/archive`, {
    method: 'PUT',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
