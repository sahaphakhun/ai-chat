import React, { useEffect, useRef } from 'react'
import type { Message } from '../types'

export const MessageList: React.FC<{ messages: Message[] }> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
      {messages.map(m => (
        <div key={m.id} className={`max-w-[85%] md:max-w-3xl ${m.role === 'user' ? 'ml-auto' : ''}`}>
          <div className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-sm
            ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-100'}`}>
            {m.content}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
