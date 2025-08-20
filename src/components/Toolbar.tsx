import React from 'react'
import { useChat } from '../contexts/ChatContext'
import { useSettings } from '../contexts/SettingsContext'
import { exportAsJson, importFromJson } from '../utils/storage'
import { useToast } from '../contexts/ToastContext'

export const Toolbar: React.FC<{ onOpenSettings: () => void; onOpenSessions: () => void }> = ({ onOpenSettings, onOpenSessions }) => {
  const { newChat, deleteAll, conversations, replaceConversations, currentId, deleteChat } = useChat()
  const { settings, setSettings } = useSettings()
  const { push } = useToast()

  const onUpload = async (file: File) => {
    try {
      const convs = await importFromJson(file)
      replaceConversations(convs)
      push({ type: 'success', msg: 'อัปโหลดสำเร็จ' })
    } catch (e) {
      push({ type: 'error', msg: 'อัปโหลดล้มเหลว' })
    }
  }

  return (
    <div className="sticky top-0 z-40 flex items-center gap-2 p-2 border-b dark:border-neutral-800 overflow-x-auto whitespace-nowrap bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
      <button onClick={onOpenSessions} className="md:hidden px-3 py-1 rounded bg-neutral-200 dark:bg-neutral-700">ห้อง</button>

      <button onClick={() => newChat()}
        className="px-3 py-1 rounded bg-blue-600 text-white">ห้องใหม่</button>

      {currentId && (
        <button onClick={() => deleteChat(currentId)} className="px-3 py-1 rounded bg-amber-600 text-white">
          ลบห้องนี้
        </button>
      )}

      <button onClick={() => deleteAll()} className="px-3 py-1 rounded bg-red-600 text-white">
        ลบทั้งหมด
      </button>

      <button onClick={() => exportAsJson(conversations)} className="px-3 py-1 rounded bg-neutral-200 dark:bg-neutral-700">
        ดาวน์โหลด .json
      </button>

      <label className="px-3 py-1 rounded bg-neutral-200 dark:bg-neutral-700 cursor-pointer">
        อัปโหลดคืน
        <input type="file" accept="application/json" className="hidden"
          onChange={e => e.target.files && onUpload(e.target.files[0])} />
      </label>

      <div className="flex-1" />

      <button onClick={onOpenSettings} className="px-3 py-1 rounded bg-neutral-200 dark:bg-neutral-700">
        ตั้งค่า
      </button>

      <button
        onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))}
        className="px-3 py-1 rounded bg-neutral-200 dark:bg-neutral-700">
        {settings.theme === 'dark' ? 'Light' : 'Dark'}
      </button>
    </div>
  )
}
