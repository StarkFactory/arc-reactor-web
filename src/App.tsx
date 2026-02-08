import { useState } from 'react'
import { useChatContext } from './context/ChatContext'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { ChatArea } from './components/chat/ChatArea'
import { SettingsPanel } from './components/settings/SettingsPanel'
import './App.css'

function AppContent() {
  const { settings } = useChatContext()
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 768 && settings.sidebarOpen
  )
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
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
  )
}

export default function App() {
  return <AppContent />
}
