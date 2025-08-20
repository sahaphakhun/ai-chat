import React, { useRef, useState } from 'react'
import { useChat } from '../contexts/ChatContext'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useSettings } from '../contexts/SettingsContext'
import { streamChat } from '../utils/openai'
import { useToast } from '../contexts/ToastContext'
import { countTokensText } from '../utils/token'
import type { Message } from '../types'

export const ChatWindow: React.FC = () => {
  const { conversations, currentId, addMessage, startAssistant, appendAssistantDelta, endAssistant } = useChat()
  const { settings } = useSettings()
  const { push } = useToast()
  const abortRef = useRef<AbortController | null>(null)
  const [loading, setLoading] = useState(false)

  const conv = currentId ? conversations[currentId] : undefined
  const messages = conv?.messages ?? []

  const onSend = async (text: string) => {
    if (!currentId) {
      push({ type: 'error', msg: 'กำลังโหลดห้องสนทนา โปรดลองอีกครั้ง' })
      return
    }
    addMessage({ role: 'user', content: text, tokens: countTokensText(text) })

    setLoading(true)
    const assistId = startAssistant()
    const controller = new AbortController()
    abortRef.current = controller
    // ส่งประวัติโดยรวม "รวมข้อความล่าสุดของผู้ใช้" ไปยังสตรีม เพื่อหลีกเลี่ยงปัญหา state ยังไม่อัปเดตทันที
    const payloadMessages: Message[] = [
      ...messages,
      { id: 'temp-user', role: 'user', content: text } as Message
    ]

    await streamChat({
      apiKey: settings.apiKey.trim(),
      model: settings.model,
      systemPrompt: settings.systemPrompt,
      messages: payloadMessages,
      onChunk: (d) => appendAssistantDelta(assistId, d),
      onDone: () => { endAssistant(); setLoading(false) },
      onError: (e) => {
        const msg = e instanceof Error ? e.message : 'สตรีมล้มเหลว'
        push({ type: 'error', msg })
        endAssistant()
        setLoading(false)
      },
      abortSignal: controller.signal
    })
  }

  const stop = () => { abortRef.current?.abort(); setLoading(false) }

  // Empty state when no conversation
  if (!currentId || messages.length === 0) {
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="font-medium text-blue-900 dark:text-blue-300">💡 เคล็ดลับ</div>
                <div className="text-blue-700 dark:text-blue-400">ใช้คำสั่งที่ชัดเจนเพื่อผลลัพธ์ที่ดี</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="font-medium text-green-900 dark:text-green-300">🔧 ตั้งค่า</div>
                <div className="text-green-700 dark:text-green-400">ปรับแต่ง API Key และโมเดลในตั้งค่า</div>
              </div>
            </div>
          </div>
        </div>
        <MessageInput onSend={onSend} disabled={loading || !currentId} />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <MessageList messages={messages} />
      
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>โมเดล: {settings.model}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            ข้อความ: {messages.length}
          </div>
        </div>
        
        {loading && (
          <button 
            onClick={stop} 
            className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm"
          >
            <span>⏹️</span>
            <span>หยุด</span>
          </button>
        )}
      </div>
      
      <MessageInput onSend={onSend} disabled={loading || !currentId} />
    </div>
  )
}
