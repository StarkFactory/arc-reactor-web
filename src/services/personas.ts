import type { PersonaResponse, CreatePersonaRequest, UpdatePersonaRequest } from '../types/api'
import { api } from '../lib/http'

export const listPersonas = (): Promise<PersonaResponse[]> =>
  api.get('personas').json()

export const getPersona = (id: string): Promise<PersonaResponse> =>
  api.get(`personas/${id}`).json()

export const createPersona = (request: CreatePersonaRequest): Promise<PersonaResponse> =>
  api.post('personas', { json: request }).json()

export const updatePersona = (id: string, request: UpdatePersonaRequest): Promise<PersonaResponse> =>
  api.put(`personas/${id}`, { json: request }).json()

export const deletePersona = (id: string): Promise<void> =>
  api.delete(`personas/${id}`).then(() => undefined)
