import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '../authStore'

// Silence i18n initialisation noise in the test environment
vi.mock('../../i18n/index', () => ({
  default: { t: (key: string) => key },
}))

vi.mock('../../services/auth', () => ({
  checkAuthRequired: vi.fn().mockResolvedValue({}),
  getMe: vi.fn().mockResolvedValue({ id: '1', email: 'a@b.com', name: 'Alice', role: 'USER' }),
  login: vi.fn(),
  register: vi.fn(),
}))

vi.mock('../../utils/api-client', () => ({
  getAuthToken: vi.fn().mockReturnValue(null),
  setAuthToken: vi.fn(),
  removeAuthToken: vi.fn(),
  setOnUnauthorized: vi.fn(),
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthRequired: false,
      isLoading: true,
      error: null,
    })
  })

  it('starts with sensible defaults', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthRequired).toBe(false)
    expect(state.isLoading).toBe(true)
    expect(state.error).toBeNull()
  })

  it('logout clears the user and error', () => {
    useAuthStore.setState({ user: { id: '1', email: 'a@b.com', name: 'Alice', role: 'USER' }, error: 'oops' })
    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.error).toBeNull()
  })

  it('clearError sets error to null', () => {
    useAuthStore.setState({ error: 'some error' })
    useAuthStore.getState().clearError()
    expect(useAuthStore.getState().error).toBeNull()
  })

  it('login sets error when API returns an error field', async () => {
    const authApi = await import('../../services/auth')
    vi.mocked(authApi.login).mockResolvedValueOnce({ token: '', user: null, error: 'Bad credentials' })

    const success = await useAuthStore.getState().login('x@x.com', 'wrong')
    expect(success).toBe(false)
    expect(useAuthStore.getState().error).toBe('Bad credentials')
  })

  it('login sets user on successful response', async () => {
    const authApi = await import('../../services/auth')
    const user = { id: '2', email: 'u@u.com', name: 'Bob', role: 'USER' as const }
    vi.mocked(authApi.login).mockResolvedValueOnce({ token: 'tok', user })

    const success = await useAuthStore.getState().login('u@u.com', 'pass')
    expect(success).toBe(true)
    expect(useAuthStore.getState().user).toEqual(user)
  })
})
