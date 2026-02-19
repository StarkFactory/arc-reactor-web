import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from '../uiStore'
import { DEFAULT_SETTINGS } from '../../utils/constants'

describe('useUiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ settingsByUser: {} })
  })

  it('returns DEFAULT_SETTINGS for an unknown user', () => {
    const state = useUiStore.getState()
    const settings = state.settingsByUser['unknown'] ?? DEFAULT_SETTINGS
    expect(settings).toEqual(DEFAULT_SETTINGS)
  })

  it('updateSettings merges partial settings for a user', () => {
    useUiStore.getState().updateSettings({ darkMode: false }, 'user-1')
    const settings = useUiStore.getState().settingsByUser['user-1']
    expect(settings?.darkMode).toBe(false)
    // Other fields should remain as defaults
    expect(settings?.sidebarOpen).toBe(DEFAULT_SETTINGS.sidebarOpen)
  })

  it('updateSettings uses __anon key when no userId is given', () => {
    useUiStore.getState().updateSettings({ darkMode: false })
    const settings = useUiStore.getState().settingsByUser['__anon']
    expect(settings?.darkMode).toBe(false)
  })

  it('resetSettings restores DEFAULT_SETTINGS for a user', () => {
    useUiStore.getState().updateSettings({ darkMode: false, sidebarOpen: false }, 'user-2')
    useUiStore.getState().resetSettings('user-2')
    const settings = useUiStore.getState().settingsByUser['user-2']
    expect(settings).toEqual(DEFAULT_SETTINGS)
  })

  it('settings are isolated between different users', () => {
    useUiStore.getState().updateSettings({ darkMode: false }, 'user-a')
    useUiStore.getState().updateSettings({ darkMode: true }, 'user-b')
    expect(useUiStore.getState().settingsByUser['user-a']?.darkMode).toBe(false)
    expect(useUiStore.getState().settingsByUser['user-b']?.darkMode).toBe(true)
  })
})
