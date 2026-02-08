import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { ChatArea } from './components/chat/ChatArea'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { LoginPage } from './components/auth/LoginPage'
import './App.css'

function AppContent() {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 768
  )
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Auto-close sidebar when resizing to mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <ChatProvider key={user?.id || 'anonymous'}>
      <div className="App">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="App-main">
          <Header
            onToggleSidebar={() => setSidebarOpen(prev => !prev)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
          <ChatArea />
        </div>
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
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
