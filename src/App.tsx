import { useState } from 'react'
import { Toolbar } from './components/Toolbar'
import { SessionList } from './components/SessionList'
import { ChatWindow } from './components/ChatWindow'
import { SettingsDrawer } from './components/SettingsDrawer'
import { useTheme } from './hooks/useTheme'
import { useSettings } from './contexts/SettingsContext'

export default function App() {
  const [open, setOpen] = useState(false)
  const [openSessions, setOpenSessions] = useState(false)
  const { settings } = useSettings()
  useTheme(settings.theme)

  return (
    <div className="h-screen flex flex-col text-neutral-900 dark:text-neutral-100">
      <Toolbar onOpenSettings={() => setOpen(true)} onOpenSessions={() => setOpenSessions(true)} />
      <div className="flex flex-1">
        <div className="hidden md:block">
          <SessionList />
        </div>
        <ChatWindow />
      </div>

      {/* Mobile Sessions Drawer */}
      {openSessions && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenSessions(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white dark:bg-neutral-900 border-r dark:border-neutral-800 shadow-xl transform transition-transform">
            <div className="flex items-center justify-between p-2 border-b dark:border-neutral-800">
              <div className="font-medium">ห้องสนทนา</div>
              <button onClick={() => setOpenSessions(false)} className="px-2 py-1 rounded bg-neutral-200 dark:bg-neutral-700">ปิด</button>
            </div>
            <SessionList className="w-full h-[calc(100vh-44px)] overflow-y-auto" onSelect={() => setOpenSessions(false)} />
          </div>
        </div>
      )}

      <SettingsDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
