import { useState } from 'react'
import { ChatWindow } from './components/ChatWindow'
import { SettingsDrawer } from './components/SettingsDrawer'
import { Toolbar } from './components/Toolbar'
import { useTheme } from './hooks/useTheme'
import { useSettings } from './contexts/SettingsContext'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { settings, setSettings } = useSettings()
  useTheme(settings.theme)

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Chat</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {settings.theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <Toolbar />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <ChatWindow />
      </main>

      {/* Settings Drawer */}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
