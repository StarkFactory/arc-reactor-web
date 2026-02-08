import type { PersonaResponse, CreatePersonaRequest, UpdatePersonaRequest } from '../types/api'
import { API_BASE } from '../utils/constants'

export async function listPersonas(): Promise<PersonaResponse[]> {
  const res = await fetch(`${API_BASE}/api/personas`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getPersona(id: string): Promise<PersonaResponse> {
  const res = await fetch(`${API_BASE}/api/personas/${id}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createPersona(request: CreatePersonaRequest): Promise<PersonaResponse> {
  const res = await fetch(`${API_BASE}/api/personas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function updatePersona(id: string, request: UpdatePersonaRequest): Promise<PersonaResponse> {
  const res = await fetch(`${API_BASE}/api/personas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deletePersona(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/personas/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
