import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatSettings } from '../types/chat'
import { DEFAULT_SETTINGS } from '../utils/constants'

interface UiState {
  // Settings are keyed by userId; '__anon' is used for unauthenticated users
  settingsByUser: Record<string, ChatSettings>
  updateSettings: (partial: Partial<ChatSettings>, userId?: string) => void
  resetSettings: (userId?: string) => void
}

const toKey = (userId?: string) => userId ?? '__anon'

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      settingsByUser: {},

      updateSettings: (partial, userId) => {
        const key = toKey(userId)
        set((state) => ({
          settingsByUser: {
            ...state.settingsByUser,
            [key]: { ...(state.settingsByUser[key] ?? DEFAULT_SETTINGS), ...partial },
          },
        }))
      },

      resetSettings: (userId) => {
        const key = toKey(userId)
        set((state) => ({
          settingsByUser: {
            ...state.settingsByUser,
            [key]: DEFAULT_SETTINGS,
          },
        }))
      },
    }),
    { name: 'arc-reactor-settings' }
  )
)
