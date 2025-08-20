import React, { useEffect, useRef } from 'react'
import type { Message } from '../types'

export const MessageList: React.FC<{ messages: Message[] }> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null)
  
  // เลื่อนลงล่างเมื่อมีข้อความใหม่
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>ยังไม่มีข้อความ</p>
          <p className="text-sm mt-2">เริ่มต้นการสนทนาโดยพิมพ์ข้อความด้านล่าง</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] md:max-w-2xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
            <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${message.role === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                }`}>
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              
              {/* Message Content */}
              <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm shadow-sm
                  ${message.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                  }`}>
                  {message.content || (message.role === 'assistant' ? 'กำลังพิมพ์...' : '')}
                </div>
                
                {/* Message Info */}
                <div className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span>{message.role === 'user' ? 'คุณ' : 'AI Assistant'}</span>
                  {message.tokens && (
                    <span className="ml-2">• {message.tokens} tokens</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
