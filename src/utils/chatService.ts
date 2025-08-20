import type { Message, Conversation } from '../types'
import { logger } from './logger'

export type StreamOptions = {
  apiKey: string
  model: string
  systemPrompt?: string
  messages: Message[]
  onChunk: (delta: string) => void
  onDone: () => void
  onError: (error: Error) => void
  abortSignal?: AbortSignal
}

export class ChatService {
  private static async streamChat(opts: StreamOptions) {
    const { apiKey, model, systemPrompt, messages, onChunk, onDone, onError, abortSignal } = opts
    
    const body = {
      model,
      stream: true,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ]
    }

    logger.info('chat', 'เริ่มสตรีม', { model, messagesCount: messages.length })

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
        signal: abortSignal
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue

          const data = trimmed.replace(/^data:\s*/, '')
          if (data === '[DONE]') {
            logger.info('chat', 'สตรีมเสร็จสิ้น')
            onDone()
            return
          }

          try {
            const json = JSON.parse(data)
            const delta = json?.choices?.[0]?.delta?.content || ''
            if (delta) {
              onChunk(delta)
            }
          } catch (e) {
            // ignore parsing errors for keepalive messages
          }
        }
      }

      onDone()
    } catch (error) {
      logger.error('chat', 'สตรีมผิดพลาด', { error: String(error) })
      onError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  static async sendMessage(
    conversation: Conversation,
    userMessage: string,
    apiKey: string,
    model: string,
    systemPrompt: string,
    onChunk: (delta: string) => void,
    onDone: () => void,
    onError: (error: Error) => void,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const messages = conversation.messages.map(m => ({
      role: m.role,
      content: m.content
    }))

    // เพิ่มข้อความผู้ใช้ล่าสุด
    messages.push({ role: 'user', content: userMessage })

    await this.streamChat({
      apiKey,
      model,
      systemPrompt,
      messages,
      onChunk,
      onDone,
      onError,
      abortSignal
    })
  }
}
