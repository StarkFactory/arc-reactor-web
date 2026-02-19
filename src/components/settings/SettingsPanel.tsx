import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useChatContext } from '../../context/ChatContext'
import { useAuth } from '../../context/AuthContext'
import { ModelSelector } from './ModelSelector'
import { PersonaSelector } from './PersonaSelector'
import { PromptTemplateManager } from './PromptTemplateManager'
import { McpServerManager } from './McpServerManager'
import './SettingsPanel.css'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { t, i18n } = useTranslation()
  const { settings, updateSettings, resetSettings } = useChatContext()
  const { isAuthenticated, isAdmin, isAuthRequired, user, logout } = useAuth()

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  const handlePersonaChange = (personaId: string | null) => {
    updateSettings({ selectedPersonaId: personaId })
    // Clear custom system prompt when persona is selected
    if (personaId) updateSettings({ selectedPersonaId: personaId, systemPrompt: '' })
  }

  if (!open) return null

  const isPersonaSelected = !!settings.selectedPersonaId

  return (
    <>
      <div className="SettingsPanel-backdrop" onClick={onClose} />
      <div className="SettingsPanel">
        <div className="SettingsPanel-header">
          <h2>{t('settings.title')}</h2>
          <button className="SettingsPanel-closeBtn" onClick={onClose} aria-label={t('settings.close')}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        <div className="SettingsPanel-body">
          <div className="SettingsPanel-section">
            <label className="SettingsPanel-label">{t('settings.model')}</label>
            <ModelSelector
              value={settings.model}
              onChange={model => updateSettings({ model })}
            />
          </div>

          <div className="SettingsPanel-section">
            <label className="SettingsPanel-label">{t('settings.persona')}</label>
            <PersonaSelector
              value={settings.selectedPersonaId}
              onChange={handlePersonaChange}
            />
          </div>

          {!isPersonaSelected && (!isAuthRequired || isAdmin) && (
            <div className="SettingsPanel-section">
              <label className="SettingsPanel-label">{t('settings.promptTemplate')}</label>
              <PromptTemplateManager
                value={settings.selectedPromptTemplateId}
                onChange={(templateId) => updateSettings({ selectedPromptTemplateId: templateId })}
              />
            </div>
          )}

          {!isPersonaSelected && !settings.selectedPromptTemplateId && (
            <div className="SettingsPanel-section">
              <label className="SettingsPanel-label">{t('settings.customPrompt')}</label>
              <textarea
                className="SettingsPanel-textarea"
                value={settings.systemPrompt}
                onChange={e => updateSettings({ systemPrompt: e.target.value })}
                placeholder={t('settings.customPromptPlaceholder')}
                rows={4}
              />
            </div>
          )}

          <div className="SettingsPanel-section">
            <label className="SettingsPanel-label">{t('settings.responseFormat')}</label>
            <div className="SettingsPanel-toggle">
              <button
                className={`SettingsPanel-toggleBtn ${settings.responseFormat === 'TEXT' ? 'SettingsPanel-toggleBtn--active' : ''}`}
                onClick={() => updateSettings({ responseFormat: 'TEXT' })}
              >
                {t('settings.text')}
              </button>
              <button
                className={`SettingsPanel-toggleBtn ${settings.responseFormat === 'JSON' ? 'SettingsPanel-toggleBtn--active' : ''}`}
                onClick={() => updateSettings({ responseFormat: 'JSON' })}
              >
                {t('settings.json')}
              </button>
            </div>
          </div>

          <div className="SettingsPanel-section">
            <label className="SettingsPanel-label">{t('settings.theme')}</label>
            <div className="SettingsPanel-toggle">
              <button
                className={`SettingsPanel-toggleBtn ${settings.darkMode ? 'SettingsPanel-toggleBtn--active' : ''}`}
                onClick={() => updateSettings({ darkMode: true })}
              >
                {t('settings.dark')}
              </button>
              <button
                className={`SettingsPanel-toggleBtn ${!settings.darkMode ? 'SettingsPanel-toggleBtn--active' : ''}`}
                onClick={() => updateSettings({ darkMode: false })}
              >
                {t('settings.light')}
              </button>
            </div>
          </div>

          <div className="SettingsPanel-section">
            <label className="SettingsPanel-label">{t('settings.showDuration')}</label>
            <div className="SettingsPanel-toggle">
              <button
                className={`SettingsPanel-toggleBtn ${settings.showMetadata ? 'SettingsPanel-toggleBtn--active' : ''}`}
                onClick={() => updateSettings({ showMetadata: true })}
              >
                {t('settings.show')}
              </button>
              <button
                className={`SettingsPanel-toggleBtn ${!settings.showMetadata ? 'SettingsPanel-toggleBtn--active' : ''}`}
                onClick={() => updateSettings({ showMetadata: false })}
              >
                {t('settings.hide')}
              </button>
            </div>
          </div>

          <div className="SettingsPanel-section">
            <label className="SettingsPanel-label">{t('settings.language')}</label>
            <div className="SettingsPanel-toggle">
              <button
                className={`SettingsPanel-toggleBtn ${i18n.language === 'en' ? 'SettingsPanel-toggleBtn--active' : ''}`}
                onClick={() => i18n.changeLanguage('en')}
              >
                English
              </button>
              <button
                className={`SettingsPanel-toggleBtn ${i18n.language === 'ko' ? 'SettingsPanel-toggleBtn--active' : ''}`}
                onClick={() => i18n.changeLanguage('ko')}
              >
                한국어
              </button>
            </div>
          </div>

          {(!isAuthRequired || isAdmin) && (
            <>
              <div className="SettingsPanel-divider" />

              <div className="SettingsPanel-section">
                <label className="SettingsPanel-label">{t('settings.mcpServers')}</label>
                <McpServerManager />
              </div>
            </>
          )}
        </div>

        <div className="SettingsPanel-footer">
          {isAuthenticated && (
            <div className="SettingsPanel-userInfo">
              <span className="SettingsPanel-userName">{user?.name} ({user?.email})</span>
              <button className="SettingsPanel-logoutBtn" onClick={logout}>
                {t('settings.logout')}
              </button>
            </div>
          )}
          <button className="SettingsPanel-resetBtn" onClick={resetSettings}>
            {t('settings.reset')}
          </button>
        </div>
      </div>
    </>
  )
}
