import { useState, useEffect, useMemo } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { ChatProvider, useChatContext } from './context/ChatContext'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { ChatArea } from './components/chat/ChatArea'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { LoginPage } from './components/auth/LoginPage'
import { AppsLayout } from './components/apps/AppsLayout'
import { AppsPage } from './components/apps/AppsPage'
import { ErrorReportPage } from './components/apps/ErrorReportPage'
import { AdminLayout } from './components/admin/AdminLayout'
import { DashboardPage } from './components/admin/pages/DashboardPage'
import { McpServersPage } from './components/admin/pages/McpServersPage'
import { PersonasPage } from './components/admin/pages/PersonasPage'
import { IntentsPage } from './components/admin/pages/IntentsPage'
import { OutputGuardPage } from './components/admin/pages/OutputGuardPage'
import { ToolPolicyPage } from './components/admin/pages/ToolPolicyPage'
import { SchedulerPage } from './components/admin/pages/SchedulerPage'
import { ClippingCategoriesPage } from './components/admin/pages/ClippingCategoriesPage'
import { ClippingSourcesPage } from './components/admin/pages/ClippingSourcesPage'
import { ClippingPersonasPage } from './components/admin/pages/ClippingPersonasPage'
import { ClippingStatsPage } from './components/admin/pages/ClippingStatsPage'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import './App.css'

function ChatLayout({
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

function ChatPage() {
  const { user } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <ChatProvider key={user?.id || 'anonymous'}>
      <ChatLayout
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

  return (
    <Routes>
      <Route path="/apps" element={<AppsLayout />}>
        <Route index element={<AppsPage />} />
        <Route path="error-report" element={<ErrorReportPage />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="mcp-servers" element={<McpServersPage />} />
        <Route path="personas" element={<PersonasPage />} />
        <Route path="intents" element={<IntentsPage />} />
        <Route path="output-guard" element={<OutputGuardPage />} />
        <Route path="tool-policy" element={<ToolPolicyPage />} />
        <Route path="scheduler" element={<SchedulerPage />} />
        <Route path="clipping/categories" element={<ClippingCategoriesPage />} />
        <Route path="clipping/sources" element={<ClippingSourcesPage />} />
        <Route path="clipping/personas" element={<ClippingPersonasPage />} />
        <Route path="clipping/stats" element={<ClippingStatsPage />} />
      </Route>
      <Route path="*" element={<ChatPage />} />
    </Routes>
  )
}
