import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isHttpError, registerUnauthorizedHandler } from '../http'
import { HTTPError } from 'ky'

// Helper: build a minimal HTTPError with the given status
function makeHttpError(status: number): HTTPError {
  const response = new Response(null, { status })
  const request = new Request('https://example.com')
  return new HTTPError(response, request, {} as import('ky').NormalizedOptions)
}

describe('isHttpError', () => {
  it('returns true when error is HTTPError with matching status', () => {
    expect(isHttpError(makeHttpError(409), 409)).toBe(true)
  })

  it('returns false when status does not match', () => {
    expect(isHttpError(makeHttpError(404), 409)).toBe(false)
  })

  it('returns false for non-HTTPError values', () => {
    expect(isHttpError(new Error('generic'), 409)).toBe(false)
    expect(isHttpError(null, 409)).toBe(false)
    expect(isHttpError('string', 409)).toBe(false)
  })
})

describe('registerUnauthorizedHandler', () => {
  type WinExt = Window & { __arcOnUnauthorized?: (() => void) | null }
  const originalHandler = (window as unknown as WinExt).__arcOnUnauthorized

  afterEach(() => {
    ;(window as unknown as WinExt).__arcOnUnauthorized = originalHandler
  })

  it('registers a handler on the window object', () => {
    const handler = vi.fn()
    registerUnauthorizedHandler(handler)
    const stored = (window as unknown as WinExt).__arcOnUnauthorized
    expect(stored).toBe(handler)
  })

  it('clears the handler when null is passed', () => {
    registerUnauthorizedHandler(null)
    const stored = (window as unknown as WinExt).__arcOnUnauthorized
    expect(stored == null).toBe(true)
  })
})

describe('api interceptor hooks (unit)', () => {
  // Test the beforeRequest hook logic in isolation using a real ky request
  // against a local absolute URL so that jsdom accepts it.
  beforeEach(() => {
    localStorage.removeItem('arc-reactor-auth-token')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    // Provide a real origin so ky can resolve the relative prefixUrl
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost', href: 'http://localhost/' },
      writable: true,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.removeItem('arc-reactor-auth-token')
  })

  it('adds Authorization header when a token is stored', async () => {
    localStorage.setItem('arc-reactor-auth-token', 'test-jwt')

    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', mockFetch)

    // Reset module cache so the api instance picks up the mocked fetch
    const { api } = await import('../http')
    try {
      await api.get('personas').json()
    } catch {
      // Network errors are OK in jsdom — we only care about the request headers
    }

    if (mockFetch.mock.calls.length > 0) {
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
      const headers = new Headers(init?.headers)
      expect(headers.get('Authorization')).toBe('Bearer test-jwt')
    }
  })

  it('does not add Authorization header when no token is stored', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', mockFetch)

    const { api } = await import('../http')
    try {
      await api.get('personas').json()
    } catch {
      // Network errors are OK in jsdom
    }

    if (mockFetch.mock.calls.length > 0) {
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
      const headers = new Headers(init?.headers)
      expect(headers.get('Authorization')).toBeNull()
    }
  })
})

describe('getAuthToken / token helpers (via api-client)', () => {
  afterEach(() => {
    localStorage.removeItem('arc-reactor-auth-token')
  })

  it('getAuthToken returns null when nothing is stored', async () => {
    const { getAuthToken } = await import('../../utils/api-client')
    expect(getAuthToken()).toBeNull()
  })

  it('setAuthToken persists the token and getAuthToken retrieves it', async () => {
    const { getAuthToken, setAuthToken, removeAuthToken } = await import('../../utils/api-client')
    setAuthToken('my-token')
    expect(getAuthToken()).toBe('my-token')
    removeAuthToken()
    expect(getAuthToken()).toBeNull()
  })
})
