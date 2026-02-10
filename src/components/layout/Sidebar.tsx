import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useChatContext } from '../../context/ChatContext'
import { formatRelativeTime } from '../../utils/formatters'
import { exportAsJson, exportAsMarkdown } from '../../utils/export'
import './Sidebar.css'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const { sessions, activeSessionId, createSession, switchSession, deleteSession } = useChatContext()
  const [exportMenuId, setExportMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || window.innerWidth >= 768) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Close export menu on outside click
  useEffect(() => {
    if (!exportMenuId) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExportMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [exportMenuId])

  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)

  const handleSelect = (id: string) => {
    switchSession(id)
    if (window.innerWidth < 768) onClose()
  }

  const handleExportClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    setExportMenuId(prev => prev === sessionId ? null : sessionId)
  }

  const handleExportJson = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    const session = sessions.find(s => s.id === sessionId)
    if (session) exportAsJson(session)
    setExportMenuId(null)
  }

  const handleExportMarkdown = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    const session = sessions.find(s => s.id === sessionId)
    if (session) exportAsMarkdown(session)
    setExportMenuId(null)
  }

  return (
    <>
      {open && <div className="Sidebar-backdrop" onClick={onClose} />}
      <aside className={`Sidebar ${open ? 'Sidebar--open' : ''}`}>
        <div className="Sidebar-header">
          <button className="Sidebar-newChat" onClick={createSession}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z" />
            </svg>
            {t('sidebar.newChat')}
          </button>
        </div>
        <nav className="Sidebar-list">
          {sorted.map(session => (
            <div
              key={session.id}
              className={`Sidebar-item ${session.id === activeSessionId ? 'Sidebar-item--active' : ''}`}
              onClick={() => handleSelect(session.id)}
            >
              <div className="Sidebar-itemTitle">{session.title}</div>
              <div className="Sidebar-itemMeta">{formatRelativeTime(session.updatedAt)}</div>
              <div className="Sidebar-actions">
                <div className="Sidebar-exportWrapper">
                  <button
                    className="Sidebar-actionBtn"
                    onClick={(e) => handleExportClick(e, session.id)}
                    aria-label={t('sidebar.export')}
                    title={t('sidebar.export')}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 01-1.06 1.06L9.75 5.56v6.19a.75.75 0 01-1.5 0V5.56L5.53 8.28a.75.75 0 01-1.06-1.06l4.25-4.25z" />
                      <path d="M3.5 9.75a.75.75 0 00-1.5 0v1.5A2.75 2.75 0 004.75 14h6.5A2.75 2.75 0 0014 11.25v-1.5a.75.75 0 00-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5z" />
                    </svg>
                  </button>
                  {exportMenuId === session.id && (
                    <div className="Sidebar-exportMenu" ref={menuRef}>
                      <button
                        className="Sidebar-exportMenuItem"
                        onClick={(e) => handleExportJson(e, session.id)}
                      >
                        JSON
                      </button>
                      <button
                        className="Sidebar-exportMenuItem"
                        onClick={(e) => handleExportMarkdown(e, session.id)}
                      >
                        Markdown
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="Sidebar-actionBtn Sidebar-actionBtn--delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(t('sidebar.deleteConfirm'))) {
                      deleteSession(session.id)
                    }
                  }}
                  aria-label={t('sidebar.deleteLabel')}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" />
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
