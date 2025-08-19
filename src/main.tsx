import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { SettingsProvider } from './contexts/SettingsContext'
import { ChatProvider } from './contexts/ChatContext'
import { ToastProvider } from './contexts/ToastContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastProvider>
      <SettingsProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </SettingsProvider>
    </ToastProvider>
  </React.StrictMode>
)
