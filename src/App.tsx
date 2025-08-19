import React, { useState } from 'react'
import { Toolbar } from './components/Toolbar'
import { SessionList } from './components/SessionList'
import { ChatWindow } from './components/ChatWindow'
import { SettingsDrawer } from './components/SettingsDrawer'
import { useTheme } from './hooks/useTheme'
import { useSettings } from './contexts/SettingsContext'

export default function App() {
  const [open, setOpen] = useState(false)
  const { settings } = useSettings()
  useTheme(settings.theme)

  return (
    <div className="h-screen flex flex-col text-neutral-900 dark:text-neutral-100">
      <Toolbar onOpenSettings={() => setOpen(true)} />
      <div className="flex flex-1">
        <SessionList />
        <ChatWindow />
      </div>
      <SettingsDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
