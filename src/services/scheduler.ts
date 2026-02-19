import type {
  CreateScheduledJobRequest,
  ScheduledJobResponse,
  UpdateScheduledJobRequest,
} from '../types/api'
import { api, HTTPError } from '../lib/http'

export const listScheduledJobs = (): Promise<ScheduledJobResponse[]> =>
  api.get('scheduler/jobs').json()

export const getScheduledJob = (id: string): Promise<ScheduledJobResponse> =>
  api.get(`scheduler/jobs/${encodeURIComponent(id)}`).json()

export const createScheduledJob = (request: CreateScheduledJobRequest): Promise<ScheduledJobResponse> =>
  api.post('scheduler/jobs', { json: request }).json()

export const updateScheduledJob = (id: string, request: UpdateScheduledJobRequest): Promise<ScheduledJobResponse> =>
  api.put(`scheduler/jobs/${encodeURIComponent(id)}`, { json: request }).json()

// ky treats 204 No Content as a successful response, so no special handling is needed.
export const deleteScheduledJob = (id: string): Promise<void> =>
  api.delete(`scheduler/jobs/${encodeURIComponent(id)}`).then(() => undefined)

export async function triggerScheduledJob(id: string): Promise<{ result: string }> {
  try {
    return await api.post(`scheduler/jobs/${encodeURIComponent(id)}/trigger`).json()
  } catch (error) {
    if (error instanceof HTTPError) {
      // Attempt to extract a server-provided error message from the response body
      const body = await error.response.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error || error.message)
    }
    throw error
  }
}
