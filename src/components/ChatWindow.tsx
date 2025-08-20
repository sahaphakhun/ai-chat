import React, { useRef, useEffect } from 'react'
import { useChat } from '../contexts/ChatContext'
import { useSettings } from '../contexts/SettingsContext'
import { useToast } from '../contexts/ToastContext'
import { ChatService } from '../utils/chatService'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { logger } from '../utils/logger'

export const ChatWindow: React.FC = () => {
  const { state, actions } = useChat()
  const { settings } = useSettings()
  const { push } = useToast()
  const abortControllerRef = useRef<AbortController | null>(null)

  // สร้างห้องสนทนาใหม่ถ้ายังไม่มี
  useEffect(() => {
    if (!state.currentConversationId && Object.keys(state.conversations).length === 0) {
      actions.createConversation()
    }
  }, [state.currentConversationId, state.conversations, actions])

  const currentConversation = state.currentConversationId 
    ? state.conversations[state.currentConversationId] 
    : null

  const handleSendMessage = async (text: string) => {
    if (!currentConversation) {
      push({ type: 'error', msg: 'ไม่พบห้องสนทนา' })
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
      const userMessageId = actions.addMessage(currentConversation.id, 'user', text)

      // สร้างข้อความ assistant ว่าง
      const assistantMessageId = actions.addMessage(currentConversation.id, 'assistant', '')

      // สร้าง AbortController สำหรับยกเลิกการสตรีม
      abortControllerRef.current = new AbortController()

      // เริ่มสตรีม
      await ChatService.sendMessage(
        currentConversation,
        text,
        settings.apiKey,
        settings.model,
        settings.systemPrompt,
        // onChunk - อัปเดตข้อความ assistant แบบเรียลไทม์
        (delta: string) => {
          const currentContent = currentConversation.messages.find(m => m.id === assistantMessageId)?.content || ''
          actions.updateMessage(currentConversation.id, assistantMessageId, currentContent + delta)
        },
        // onDone - จบการสตรีม
        () => {
          actions.setLoading(false)
          logger.info('chat', 'การสนทนาสำเร็จ')
        },
        // onError - จัดการข้อผิดพลาด
        (error: Error) => {
          actions.setLoading(false)
          actions.setError(error.message)
          push({ type: 'error', msg: error.message })
          logger.error('chat', 'การสนทนาล้มเหลว', { error: error.message })
        },
        abortControllerRef.current.signal
      )

    } catch (error) {
      actions.setLoading(false)
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
      actions.setError(errorMessage)
      push({ type: 'error', msg: errorMessage })
      logger.error('chat', 'การส่งข้อความล้มเหลว', { error: String(error) })
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
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
              ยินดีต้อนรับสู่ AI Chat
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
      {/* Header */}
      <div className="px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentConversation.title}
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentConversation.messages.length} ข้อความ
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {settings.model}
            </span>
            {state.isLoading && (
              <button
                onClick={handleStop}
                className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                หยุด
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={currentConversation.messages} />

      {/* Error Display */}
      {state.error && (
        <div className="px-4 py-2 bg-red-100 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">
            ข้อผิดพลาด: {state.error}
          </p>
        </div>
      )}

      {/* Input */}
      <MessageInput onSend={handleSendMessage} disabled={state.isLoading} />
    </div>
  )
}
