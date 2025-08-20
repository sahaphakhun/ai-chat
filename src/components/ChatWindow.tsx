import React, { useRef, useState } from 'react'
import { useChat } from '../contexts/ChatContext'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useSettings } from '../contexts/SettingsContext'
import { streamChat } from '../utils/openai'
import { useToast } from '../contexts/ToastContext'
import { countTokensText } from '../utils/token'

export const ChatWindow: React.FC = () => {
  const { conversations, currentId, addMessage, startAssistant, appendAssistantDelta, endAssistant } = useChat()
  const { settings } = useSettings()
  const { push } = useToast()
  const abortRef = useRef<AbortController | null>(null)
  const [loading, setLoading] = useState(false)

  const conv = currentId ? conversations[currentId] : undefined
  const messages = conv?.messages ?? []

  const onSend = async (text: string) => {
    if (!settings.apiKey) return push({ type: 'error', msg: 'กรอก API Key ก่อน' })
    addMessage({ role: 'user', content: text, tokens: countTokensText(text) })

    setLoading(true)
    const assistId = startAssistant()
    const controller = new AbortController()
    abortRef.current = controller
    await streamChat({
      apiKey: settings.apiKey.trim(),
      model: settings.model,
      systemPrompt: settings.systemPrompt,
      messages,
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

  return (
    <div className="flex flex-col flex-1">
      <MessageList messages={messages} />
      <div className="flex items-center gap-2 px-3 pb-2">
        {loading ? <button onClick={stop} className="px-3 py-1 rounded bg-amber-600 text-white">หยุด</button> : null}
        <div className="text-xs text-neutral-500">โมเดล: {settings.model}</div>
      </div>
      <MessageInput onSend={onSend} disabled={loading} />
    </div>
  )
}
