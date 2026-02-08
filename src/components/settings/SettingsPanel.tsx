import { useEffect } from 'react'
import { useChatContext } from '../../context/ChatContext'
import { ModelSelector } from './ModelSelector'
import './SettingsPanel.css'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, updateSettings, resetSettings } = useChatContext()

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="SettingsPanel-backdrop" onClick={onClose} />
      <div className="SettingsPanel">
        <div className="SettingsPanel-header">
          <h2>설정</h2>
          <button className="SettingsPanel-closeBtn" onClick={onClose} aria-label="닫기">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        <div className="SettingsPanel-body">
          <div className="SettingsPanel-section">
            <label className="SettingsPanel-label">LLM 모델</label>
            <ModelSelector
              value={settings.model}
              onChange={model => updateSettings({ model })}
            />
          </div>

          <div className="SettingsPanel-section">
            <label className="SettingsPanel-label">시스템 프롬프트</label>
            <textarea
              className="SettingsPanel-textarea"
              value={settings.systemPrompt}
              onChange={e => updateSettings({ systemPrompt: e.target.value })}
              placeholder="AI 에이전트의 역할과 행동을 지정하세요... (비워두면 기본값 사용)"
              rows={4}
            />
          </div>

          <div className="SettingsPanel-section">
            <label className="SettingsPanel-label">응답 포맷</label>
            <div className="SettingsPanel-toggle">
              <button
                className={`SettingsPanel-toggleBtn ${settings.responseFormat === 'TEXT' ? 'SettingsPanel-toggleBtn--active' : ''}`}
                onClick={() => updateSettings({ responseFormat: 'TEXT' })}
              >
                텍스트
              </button>
              <button
                className={`SettingsPanel-toggleBtn ${settings.responseFormat === 'JSON' ? 'SettingsPanel-toggleBtn--active' : ''}`}
                onClick={() => updateSettings({ responseFormat: 'JSON' })}
              >
                JSON
              </button>
            </div>
          </div>

          <div className="SettingsPanel-section">
            <label className="SettingsPanel-label">테마</label>
            <div className="SettingsPanel-toggle">
              <button
                className={`SettingsPanel-toggleBtn ${settings.darkMode ? 'SettingsPanel-toggleBtn--active' : ''}`}
                onClick={() => updateSettings({ darkMode: true })}
              >
                다크
              </button>
              <button
                className={`SettingsPanel-toggleBtn ${!settings.darkMode ? 'SettingsPanel-toggleBtn--active' : ''}`}
                onClick={() => updateSettings({ darkMode: false })}
              >
                라이트
              </button>
            </div>
          </div>

          <div className="SettingsPanel-section">
            <label className="SettingsPanel-label">응답 시간 표시</label>
            <div className="SettingsPanel-toggle">
              <button
                className={`SettingsPanel-toggleBtn ${settings.showMetadata ? 'SettingsPanel-toggleBtn--active' : ''}`}
                onClick={() => updateSettings({ showMetadata: true })}
              >
                표시
              </button>
              <button
                className={`SettingsPanel-toggleBtn ${!settings.showMetadata ? 'SettingsPanel-toggleBtn--active' : ''}`}
                onClick={() => updateSettings({ showMetadata: false })}
              >
                숨김
              </button>
            </div>
          </div>
        </div>

        <div className="SettingsPanel-footer">
          <button className="SettingsPanel-resetBtn" onClick={resetSettings}>
            기본값으로 초기화
          </button>
        </div>
      </div>
    </>
  )
}
