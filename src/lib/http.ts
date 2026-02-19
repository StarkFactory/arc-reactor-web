import ky, { type KyInstance, HTTPError } from 'ky'
import { getAuthToken, removeAuthToken, setOnUnauthorized } from '../utils/api-client'

// Re-export HTTPError so callers can catch it without importing ky directly
export { HTTPError }

/**
 * Returns true if the given error is a ky HTTPError with the specified status.
 */
export function isHttpError(error: unknown, status: number): boolean {
  return error instanceof HTTPError && error.response.status === status
}

/**
 * Shared ky instance for the main Arc Reactor API (/api/*).
 *
 * Features vs plain fetchWithAuth:
 * - Automatic JWT injection via beforeRequest hook
 * - Automatic 401 logout via afterResponse hook
 * - Retry on transient network errors (GET only, up to 2 retries)
 * - 30-second request timeout
 * - Standardised error messages via beforeError hook
 *
 * Note: SSE streaming (streamChat) continues to use native fetch because
 * ky does not expose the raw ReadableStream required for SSE parsing.
 */
export const api: KyInstance = ky.create({
  prefixUrl: '/api',
  timeout: 30_000,
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 429, 502, 503, 504],
  },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getAuthToken()
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        if (response.status === 401) {
          removeAuthToken()
          // Notify AuthContext so it can clear the user state
          const handler = (window as unknown as { __arcOnUnauthorized?: () => void }).__arcOnUnauthorized
          if (typeof handler === 'function') handler()
        }
        return response
      },
    ],
    beforeError: [
      (error) => {
        // Attach a readable message to every HTTPError
        const { response } = error
        if (response) {
          error.message = `HTTP ${response.status} ${response.url}`
        }
        return error
      },
    ],
  },
})

/**
 * ky instance for the Clipping API (/clipping-api/*).
 * Does not inject JWT — the clipping service uses its own auth model.
 */
export const clippingApi: KyInstance = ky.create({
  prefixUrl: '/clipping-api/admin',
  timeout: 30_000,
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 429, 502, 503, 504],
  },
  hooks: {
    beforeError: [
      (error) => {
        const { response } = error
        if (response) {
          error.message = `HTTP ${response.status} ${response.url}`
        }
        return error
      },
    ],
  },
})

// Register the 401 handler so AuthContext can hook into it
export function registerUnauthorizedHandler(handler: (() => void) | null): void {
  ;(window as unknown as { __arcOnUnauthorized?: (() => void) | null }).__arcOnUnauthorized = handler ?? undefined
  // Also wire up the legacy setOnUnauthorized for api-client.ts consumers
  setOnUnauthorized(handler)
}
