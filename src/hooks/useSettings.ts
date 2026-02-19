import { useEffect } from 'react'
import type { ChatSettings } from '../types/chat'
import { DEFAULT_SETTINGS } from '../utils/constants'
import { useLocalStorage } from './useLocalStorage'

const BASE_KEY = 'arc-reactor-settings'

export function useSettings(userId?: string) {
  const storageKey = userId ? `${BASE_KEY}:${userId}` : BASE_KEY
  const [settings, setSettings] = useLocalStorage<ChatSettings>(storageKey, DEFAULT_SETTINGS)

  const updateSettings = (partial: Partial<ChatSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light')
  }, [settings.darkMode])

  return { settings, updateSettings, resetSettings }
}
