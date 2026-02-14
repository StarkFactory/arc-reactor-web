import type {
  ClippingCategory,
  CreateClippingCategoryRequest,
  ClippingSource,
  CreateClippingSourceRequest,
  UpdateClippingSourceRequest,
  ClippingPersona,
  CreateClippingPersonaRequest,
  UpdateClippingPersonaRequest,
  ClippingStat,
} from '../types/clipping'

const BASE = '/clipping-api/admin'

async function clippingFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const response = await fetch(url, { ...options, headers })
  return response
}

// ---- Categories ----

export async function listClippingCategories(): Promise<ClippingCategory[]> {
  const res = await clippingFetch(`${BASE}/categories`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createClippingCategory(req: CreateClippingCategoryRequest): Promise<ClippingCategory> {
  const res = await clippingFetch(`${BASE}/categories`, {
    method: 'POST',
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function updateClippingCategory(id: string, req: CreateClippingCategoryRequest): Promise<ClippingCategory> {
  const res = await clippingFetch(`${BASE}/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteClippingCategory(id: string): Promise<void> {
  const res = await clippingFetch(`${BASE}/categories/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

// ---- Sources ----

export async function listClippingSources(): Promise<ClippingSource[]> {
  const res = await clippingFetch(`${BASE}/sources`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createClippingSource(req: CreateClippingSourceRequest): Promise<ClippingSource> {
  const res = await clippingFetch(`${BASE}/sources`, {
    method: 'POST',
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function updateClippingSource(id: string, req: UpdateClippingSourceRequest): Promise<ClippingSource> {
  const res = await clippingFetch(`${BASE}/sources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteClippingSource(id: string): Promise<void> {
  const res = await clippingFetch(`${BASE}/sources/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function verifyClippingSource(id: string): Promise<ClippingSource> {
  const res = await clippingFetch(`${BASE}/sources/${id}/verify`, { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function approveClippingSource(id: string, approvedBy: string): Promise<ClippingSource> {
  const res = await clippingFetch(`${BASE}/sources/${id}/approve?approved=true&approvedBy=${encodeURIComponent(approvedBy)}`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function revokeClippingSource(id: string): Promise<ClippingSource> {
  const res = await clippingFetch(`${BASE}/sources/${id}/approve?approved=false`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// ---- Personas ----

export async function listClippingPersonas(): Promise<ClippingPersona[]> {
  const res = await clippingFetch(`${BASE}/personas`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createClippingPersona(req: CreateClippingPersonaRequest): Promise<ClippingPersona> {
  const res = await clippingFetch(`${BASE}/personas`, {
    method: 'POST',
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function updateClippingPersona(id: string, req: UpdateClippingPersonaRequest): Promise<ClippingPersona> {
  const res = await clippingFetch(`${BASE}/personas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteClippingPersona(id: string): Promise<void> {
  const res = await clippingFetch(`${BASE}/personas/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

// ---- Stats ----

export async function getClippingMonthlyStats(yearMonth: string, categoryId?: string): Promise<ClippingStat[]> {
  const params = new URLSearchParams({ yearMonth })
  if (categoryId) params.set('categoryId', categoryId)
  const res = await clippingFetch(`${BASE}/stats/monthly?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
