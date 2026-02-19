import type { ErrorReportRequest, ErrorReportResponse } from '../types/api'
import { api, isHttpError, HTTPError } from '../lib/http'

export async function submitErrorReport(
  request: ErrorReportRequest,
  apiKey?: string,
): Promise<ErrorReportResponse> {
  try {
    const headers: Record<string, string> = {}
    if (apiKey) {
      headers['X-API-Key'] = apiKey
    }
    return await api.post('error-report', { json: request, headers }).json()
  } catch (error) {
    if (isHttpError(error, 401)) throw new Error('UNAUTHORIZED')
    if (isHttpError(error, 400)) {
      // Attempt to extract a validation message from the response body
      const body = await (error as HTTPError).response.json().catch(() => null)
      throw new Error((body as { message?: string } | null)?.message || 'Validation failed')
    }
    throw error
  }
}
