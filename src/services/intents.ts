import type { IntentResponse, CreateIntentRequest, UpdateIntentRequest } from '../types/api'
import { api, isHttpError } from '../lib/http'

export const listIntents = (): Promise<IntentResponse[]> =>
  api.get('intents').json()

export const getIntent = (name: string): Promise<IntentResponse> =>
  api.get(`intents/${encodeURIComponent(name)}`).json()

export async function createIntent(request: CreateIntentRequest): Promise<IntentResponse> {
  try {
    return await api.post('intents', { json: request }).json()
  } catch (error) {
    if (isHttpError(error, 409)) throw new Error('CONFLICT')
    throw error
  }
}

export const updateIntent = (name: string, request: UpdateIntentRequest): Promise<IntentResponse> =>
  api.put(`intents/${encodeURIComponent(name)}`, { json: request }).json()

export const deleteIntent = (name: string): Promise<void> =>
  api.delete(`intents/${encodeURIComponent(name)}`).then(() => undefined)
