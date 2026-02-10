import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './context/AuthContext'
import { ChatProvider, useChatContext } from './context/ChatContext'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { ChatArea } from './components/chat/ChatArea'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { LoginPage } from './components/auth/LoginPage'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import './App.css'

function AppLayout({
  settingsOpen,
  onToggleSettings,
  onOpenSettings,
  onCloseSettings,
}: {
  settingsOpen: boolean
  onToggleSettings: () => void
  onOpenSettings: () => void
  onCloseSettings: () => void
}) {
  const { createSession } = useChatContext()
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 768
  )

  // Auto-close sidebar when resizing to mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Global keyboard shortcuts
  const shortcuts = useMemo(() => ({
    'n': () => createSession(),
    ',': onToggleSettings,
  }), [createSession, onToggleSettings])

  useKeyboardShortcuts(shortcuts)

  return (
    <div className="App">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="App-main">
        <Header
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onOpenSettings={onOpenSettings}
        />
        <ChatArea onOpenSettings={onOpenSettings} />
      </div>
      <SettingsPanel open={settingsOpen} onClose={onCloseSettings} />
    </div>
  )
}

function AppContent() {
  const { user } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <ChatProvider key={user?.id || 'anonymous'}>
      <AppLayout
        settingsOpen={settingsOpen}
        onToggleSettings={() => setSettingsOpen(prev => !prev)}
        onOpenSettings={() => setSettingsOpen(true)}
        onCloseSettings={() => setSettingsOpen(false)}
      />
    </ChatProvider>
  )
}

export default function App() {
  const { isAuthRequired, isAuthenticated, isLoading } = useAuth()

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="App-loading">
        <div className="App-loadingSpinner" />
      </div>
    )
  }

  // Auth is required but user is not authenticated — show login
  if (isAuthRequired && !isAuthenticated) {
    return <LoginPage />
  }

  return <AppContent />
}
