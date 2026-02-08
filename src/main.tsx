import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChatProvider } from './context/ChatContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChatProvider>
      <App />
    </ChatProvider>
  </StrictMode>,
)
