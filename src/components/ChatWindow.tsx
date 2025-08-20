import React, { useEffect, useRef, useState } from 'react'
import { useChat } from '../contexts/ChatContext'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useSettings } from '../contexts/SettingsContext'
import { streamChat } from '../utils/openai'
import { useToast } from '../contexts/ToastContext'
import { countTokensText, countTokensConversation } from '../utils/token'
import { costUSD, formatUSD } from '../utils/cost'
import { logger } from '../utils/logger'
import type { Message } from '../types'

export const ChatWindow: React.FC = () => {
  const { conversations, currentId, addUserAndStartAssistant, appendAssistantDelta, endAssistant, newChat } = useChat()
  const { settings } = useSettings()
  const { push } = useToast()
  const abortRef = useRef<AbortController | null>(null)
  const [loading, setLoading] = useState(false)

  // สร้างห้องใหม่อัตโนมัติ ถ้ายังไม่มี currentId (กันเคสโหลดค่าผิดปกติหรือ storage ว่าง)
  useEffect(() => {
    if (!currentId) {
      newChat()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  const conv = currentId ? conversations[currentId] : undefined
  const messages = conv?.messages ?? []
  const stats = countTokensConversation(messages)
  const inCost = costUSD(stats.input, settings.inPricePerK)
  const outCost = costUSD(stats.output, settings.outPricePerK)
  
  // Debug: ตรวจสอบ state
  console.log('ChatWindow render:', { 
    currentId, 
    messagesCount: messages.length, 
    messages,
    conversations: Object.keys(conversations),
    currentConversation: conversations[currentId!],
    loading
  })

  const onSend = async (text: string) => {
    console.log('ChatWindow: onSend called with text:', text)
    if (!currentId) {
      push({ type: 'error', msg: 'กำลังโหลดห้องสนทนา โปรดลองอีกครั้ง' })
      logger.warn('chat', 'พยายามส่งข้อความขณะยังไม่มีห้อง')
      return
    }
    logger.info('message', 'ผู้ใช้ส่งข้อความ', { length: text.length, preview: text.slice(0, 80) })
    console.log('ChatWindow: calling addUserAndStartAssistant with currentId:', currentId)
    const assistId = addUserAndStartAssistant({ role: 'user', content: text, tokens: countTokensText(text) })
    console.log('ChatWindow: addUserAndStartAssistant returned assistId:', assistId)
    if (!assistId) {
      push({ type: 'error', msg: 'ไม่สามารถเริ่มการสนทนาได้' })
      return
    }
    console.log('ChatWindow: setting loading to true')
    setLoading(true)
    const controller = new AbortController()
    abortRef.current = controller
    // ส่งประวัติโดยรวม "รวมข้อความล่าสุดของผู้ใช้" ไปยังสตรีม เพื่อหลีกเลี่ยงปัญหา state ยังไม่อัปเดตทันที
    const payloadMessages: Message[] = [
      ...messages,
      { id: 'temp-user', role: 'user', content: text } as Message
    ]

    const apiKey = String((settings as any)?.apiKey ?? '').trim()
    const model = (settings as any)?.model || 'gpt-5'
    logger.debug('chat', 'เริ่มสตรีมคำตอบ', { model, hasApiKey: !!apiKey, history: messages.length })

    try {
      console.log('ChatWindow: calling streamChat with payloadMessages:', payloadMessages)
      await streamChat({
        apiKey,
        model,
        systemPrompt: settings.systemPrompt,
        messages: payloadMessages,
        onChunk: (d) => {
          console.log('ChatWindow: onChunk called with delta:', d)
          appendAssistantDelta(assistId, d)
        },
        onDone: () => { 
          console.log('ChatWindow: onDone called')
          endAssistant(); 
          console.log('ChatWindow: setting loading to false in onDone')
          setLoading(false); 
          logger.info('assistant', 'สตรีมเสร็จสิ้น') 
        },
        onError: (e) => {
          console.log('ChatWindow: onError called with error:', e)
          const msg = e instanceof Error ? e.message : 'สตรีมล้มเหลว'
          push({ type: 'error', msg })
          endAssistant()
          console.log('ChatWindow: setting loading to false in onError')
          setLoading(false)
          logger.error('assistant', 'สตรีมผิดพลาด', { error: String(e) })
        },
        abortSignal: controller.signal
      })
    } catch (e) {
      console.log('ChatWindow: catch block called with error:', e)
      const msg = e instanceof Error ? e.message : 'การส่งคำขอล้มเหลว'
      push({ type: 'error', msg })
      endAssistant()
      console.log('ChatWindow: setting loading to false in catch')
      setLoading(false)
      logger.error('assistant', 'ส่งคำขอเริ่มสตรีมล้มเหลว', { error: String(e) })
    }
  }

  const stop = () => { 
    console.log('ChatWindow: stop called')
    abortRef.current?.abort(); 
    console.log('ChatWindow: setting loading to false in stop')
    setLoading(false); 
    logger.warn('assistant', 'ผู้ใช้หยุดสตรีม') 
  }

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
          </div>
        </div>
        <MessageInput onSend={onSend} disabled={loading || !currentId} />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      {/* Debug: แสดงข้อมูล messages */}
      <div className="p-2 bg-yellow-100 text-xs">
        Debug: messages count = {messages.length}, currentId = {currentId}, 
        conversations keys = {Object.keys(conversations).join(', ')},
        conv exists = {!!conv}, conv messages = {conv?.messages?.length || 0},
        loading = {loading.toString()}, 
        conv messages preview = {conv?.messages?.map(m => `${m.role}:${m.content.slice(0, 20)}`).join(', ') || 'none'},
        conv id = {conv?.id || 'none'}, conv title = {conv?.title || 'none'},
        conversations count = {Object.keys(conversations).length},
        conversations preview = {Object.entries(conversations).map(([id, conv]) => `${id}:${conv.messages.length}msgs`).join(', ')},
        currentId in conversations = {currentId ? (currentId in conversations).toString() : 'no currentId'},
        conversations[currentId] = {JSON.stringify(conversations[currentId!])}
      </div>
      <MessageList messages={messages} />
      
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
      
      <MessageInput onSend={onSend} disabled={loading || !currentId} />
    </div>
  )
}
