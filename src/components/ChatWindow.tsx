import React, { useEffect, useRef } from 'react'
import { useChat } from '../contexts/ChatContext'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useSettings } from '../contexts/SettingsContext'
import { streamChat } from '../utils/openai'
import { useToast } from '../contexts/ToastContext'
import { countTokensText, countTokensConversation } from '../utils/token'
import { costUSD, formatUSD } from '../utils/cost'
import { logger } from '../utils/logger'
import type { Message, TokenUsage } from '../types'

export const ChatWindow: React.FC = () => {
  const { state, actions } = useChat()
  const { settings } = useSettings()
  const { push } = useToast()
  const abortRef = useRef<AbortController | null>(null)

  // สร้างห้องใหม่อัตโนมัติ ถ้ายังไม่มี currentId
  useEffect(() => {
    if (!state.currentId && Object.keys(state.conversations).length === 0) {
      actions.createConversation()
    }
  }, [state.currentId, state.conversations, actions])

  const currentConversation = state.currentId ? state.conversations[state.currentId] : null
  const messages = currentConversation?.messages ?? []
  const stats = countTokensConversation(messages)
  const inCost = costUSD(stats.input, settings.inPricePerK)
  const outCost = costUSD(stats.output, settings.outPricePerK)

  const handleSendMessage = async (text: string) => {
    if (!state.currentId) {
      push({ type: 'error', msg: 'กำลังโหลดห้องสนทนา โปรดลองอีกครั้ง' })
      logger.warn('chat', 'พยายามส่งข้อความขณะยังไม่มีห้อง')
      return
    }

    if (!settings.apiKey.trim()) {
      push({ type: 'error', msg: 'กรุณาตั้งค่า API Key' })
      return
    }

    try {
      // เริ่มการโหลด
      actions.setLoading(true)
      actions.setError(null)

      // เพิ่มข้อความผู้ใช้
      actions.addUserMessage(text, countTokensText(text))

      // สร้างข้อความ assistant ว่าง
      const assistantMessageId = actions.startAssistantMessage()

      // สร้าง AbortController สำหรับยกเลิกการสตรีม
      abortRef.current = new AbortController()

      // เตรียมข้อความสำหรับส่งไป API
      const payloadMessages: Message[] = [
        ...messages,
        { id: 'temp-user', role: 'user', content: text } as Message
      ]

      logger.info('message', 'ผู้ใช้ส่งข้อความ', { 
        length: text.length, 
        preview: text.slice(0, 80) 
      })

      // เริ่มสตรีม
      await streamChat({
        apiKey: settings.apiKey.trim(),
        model: settings.model,
        systemPrompt: settings.systemPrompt,
        messages: payloadMessages,
        onChunk: (delta: string) => {
          actions.appendAssistantDelta(assistantMessageId, delta)
        },
        onDone: (usage?: TokenUsage) => {
          actions.completeAssistantMessage()
          actions.setLoading(false)
          
          if (usage) {
            // Update conversation with actual usage data
            ;(actions as any).updateConversationUsage(state.currentId!, usage)
            logger.info('assistant', 'สตรีมเสร็จสิ้น พร้อม usage data', { usage })
          } else {
            logger.info('assistant', 'สตรีมเสร็จสิ้น (ไม่มี usage data)')
          }
        },
        onError: (error: unknown) => {
          actions.setLoading(false)
          const errorMessage = error instanceof Error ? error.message : 'สตรีมล้มเหลว'
          actions.setError(errorMessage)
          push({ type: 'error', msg: errorMessage })
          logger.error('assistant', 'สตรีมผิดพลาด', { error: String(error) })
        },
        abortSignal: abortRef.current.signal
      })

    } catch (error) {
      actions.setLoading(false)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
      actions.setError(errorMessage)
      push({ type: 'error', msg: errorMessage })
      logger.error('chat', 'การส่งข้อความล้มเหลว', { error: String(error) })
    }
  }

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort()
      actions.setLoading(false)
      logger.info('chat', 'ผู้ใช้หยุดการสตรีม')
    }
  }

  // แสดงหน้าว่างถ้าไม่มีห้องสนทนา
  if (!currentConversation) {
    return (
      <div className="flex flex-col flex-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-3xl text-white">🤖</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ยินดีต้อนรับสู่ AI Chat Tester
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              เริ่มต้นการสนทนากับ AI โดยพิมพ์ข้อความด้านล่าง
            </p>
          </div>
        </div>
        <MessageInput onSend={handleSendMessage} disabled={state.isLoading} />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      {/* Messages */}
      <MessageList messages={messages} />

      {/* Error Display */}
      {state.error && (
        <div className="px-4 py-2 bg-red-100 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">
            ข้อผิดพลาด: {state.error}
          </p>
        </div>
      )}

      {/* Status Bar */}
      <div className="px-4 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>โมเดล: {settings.model}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              ข้อความ: {messages.length}
            </div>
          </div>
          
          {state.isLoading && (
            <button 
              onClick={handleStop} 
              className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm"
            >
              <span>⏹️</span>
              <span>หยุด</span>
            </button>
          )}
        </div>
        
        {/* Cost Information */}
        {messages.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                <span>💰 Total: {(stats.input + stats.output).toLocaleString()}</span>
                <span>📊 Input: {stats.input.toLocaleString()}</span>
                <span>📤 Output: {stats.output.toLocaleString()}</span>
              </div>
              <div className="font-medium text-gray-700 dark:text-gray-300">
                ค่าใช้จ่าย: <span className="text-green-600 dark:text-green-400">{formatUSD(inCost + outCost)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input */}
      <MessageInput onSend={handleSendMessage} disabled={state.isLoading} />
    </div>
  )
}
