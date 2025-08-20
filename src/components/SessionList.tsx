import React from 'react'
import { useChat } from '../contexts/ChatContext'

export const SessionList: React.FC<{ className?: string; onSelect?: () => void }> = ({ className, onSelect }) => {
  const { index, conversations, currentId, setCurrentId } = useChat()

  return (
    <div className={className ?? "w-64 shrink-0 border-r dark:border-neutral-800 overflow-y-auto h-[calc(100vh-48px)]"}>
      <div className="p-2 text-xs text-neutral-500">ห้องสนทนา</div>
      <ul className="space-y-1 p-2">
        {index.sessionIds.map(id => {
          const c = conversations[id]
          return (
            <li key={id}>
              <button
                onClick={() => { setCurrentId(id); onSelect?.() }}
                className={`w-full text-left px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 ${currentId === id ? 'bg-neutral-100 dark:bg-neutral-800' : ''}`}>
                <div className="font-medium text-sm truncate">{c?.title || 'ไม่ระบุ'}</div>
                <div className="text-xs text-neutral-500">{new Date(c.updatedAt).toLocaleString()}</div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
