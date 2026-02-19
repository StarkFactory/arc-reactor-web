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
import { clippingApi } from '../lib/http'

// ---- Categories ----

export const listClippingCategories = (): Promise<ClippingCategory[]> =>
  clippingApi.get('categories').json()

export const createClippingCategory = (req: CreateClippingCategoryRequest): Promise<ClippingCategory> =>
  clippingApi.post('categories', { json: req }).json()

export const updateClippingCategory = (id: string, req: CreateClippingCategoryRequest): Promise<ClippingCategory> =>
  clippingApi.put(`categories/${id}`, { json: req }).json()

export const deleteClippingCategory = (id: string): Promise<void> =>
  clippingApi.delete(`categories/${id}`).then(() => undefined)

// ---- Sources ----

export const listClippingSources = (): Promise<ClippingSource[]> =>
  clippingApi.get('sources').json()

export const createClippingSource = (req: CreateClippingSourceRequest): Promise<ClippingSource> =>
  clippingApi.post('sources', { json: req }).json()

export const updateClippingSource = (id: string, req: UpdateClippingSourceRequest): Promise<ClippingSource> =>
  clippingApi.put(`sources/${id}`, { json: req }).json()

export const deleteClippingSource = (id: string): Promise<void> =>
  clippingApi.delete(`sources/${id}`).then(() => undefined)

export const verifyClippingSource = (id: string): Promise<ClippingSource> =>
  clippingApi.post(`sources/${id}/verify`).json()

export const approveClippingSource = (id: string, approvedBy: string): Promise<ClippingSource> =>
  clippingApi
    .post(`sources/${id}/approve?approved=true&approvedBy=${encodeURIComponent(approvedBy)}`)
    .json()

export const revokeClippingSource = (id: string): Promise<ClippingSource> =>
  clippingApi.post(`sources/${id}/approve?approved=false`).json()

// ---- Personas ----

export const listClippingPersonas = (): Promise<ClippingPersona[]> =>
  clippingApi.get('personas').json()

export const createClippingPersona = (req: CreateClippingPersonaRequest): Promise<ClippingPersona> =>
  clippingApi.post('personas', { json: req }).json()

export const updateClippingPersona = (id: string, req: UpdateClippingPersonaRequest): Promise<ClippingPersona> =>
  clippingApi.put(`personas/${id}`, { json: req }).json()

export const deleteClippingPersona = (id: string): Promise<void> =>
  clippingApi.delete(`personas/${id}`).then(() => undefined)

// ---- Stats ----

export const getClippingMonthlyStats = (yearMonth: string, categoryId?: string): Promise<ClippingStat[]> => {
  const params = new URLSearchParams({ yearMonth })
  if (categoryId) params.set('categoryId', categoryId)
  return clippingApi.get(`stats/monthly?${params}`).json()
}
