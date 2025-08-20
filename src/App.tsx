import { useState } from 'react'
import { Toolbar } from './components/Toolbar'
import { SessionList } from './components/SessionList'
import { ChatWindow } from './components/ChatWindow'
import { SettingsDrawer } from './components/SettingsDrawer'
import { useTheme } from './hooks/useTheme'
import { LogPanel } from './components/LogPanel'
import { useSettings } from './contexts/SettingsContext'

export default function App() {
  const [open, setOpen] = useState(false)
  const [openSessions, setOpenSessions] = useState(false)
  const [openLogs, setOpenLogs] = useState(false)
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Chat Tester</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {settings.theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => setOpenLogs(true)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="เปิด Logs"
            >
              🧾
            </button>
            <button
              onClick={() => setOpen(true)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-r border-gray-200 dark:border-gray-700">
          <SessionList />
        </div>

        {/* Mobile Sidebar Overlay */}
        {openSessions && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpenSessions(false)} />
            <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] bg-white dark:bg-gray-900 shadow-2xl transform transition-transform">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">ห้องสนทนา</h2>
                <button 
                  onClick={() => setOpenSessions(false)} 
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>
              <SessionList onSelect={() => setOpenSessions(false)} />
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <Toolbar onOpenSessions={() => setOpenSessions(true)} />
          <ChatWindow />
        </div>
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer open={open} onClose={() => setOpen(false)} />
      <LogPanel open={openLogs} onClose={() => setOpenLogs(false)} />
    </div>
  )
}
