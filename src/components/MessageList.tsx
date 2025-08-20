import React, { useEffect, useRef } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { costUSD, formatUSD } from '../utils/cost'
import type { Message } from '../types'

export const MessageList: React.FC<{ messages: Message[] }> = ({ messages }) => {
  const { settings } = useSettings()
  const bottomRef = useRef<HTMLDivElement>(null)
  

  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getMessageCost = (message: Message) => {
    if (!message.tokens) return null
    const cost = message.role === 'user' 
      ? costUSD(message.tokens, settings.inPricePerK)
      : costUSD(message.tokens, settings.outPricePerK)
    return cost
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {messages.map((m) => (
        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] md:max-w-2xl lg:max-w-3xl ${m.role === 'user' ? 'order-2' : 'order-1'}`}>
            {/* Avatar */}
            <div className={`flex items-start space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${m.role === 'user' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                }`}>
                {m.role === 'user' ? '👤' : '🤖'}
              </div>
              
              {/* Message Content */}
              <div className={`flex-1 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm shadow-sm
                  ${m.role === 'user' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md' 
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-md'
                  }`}>
                  {m.content}
                </div>
                
                {/* Message Info */}
                <div className={`mt-1 text-xs text-gray-500 dark:text-gray-400 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center justify-between">
                    <span>{m.role === 'user' ? 'คุณ' : 'AI Assistant'}</span>
                    {m.tokens && (
                      <div className="flex items-center space-x-2">
                        <span>• {m.tokens} tokens</span>
                        {getMessageCost(m) && (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            • {formatUSD(getMessageCost(m)!)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
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
