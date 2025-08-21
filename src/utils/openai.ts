import type { Message, OpenAIUsage } from '../types'
import { logger } from './logger'

export async function listModels(apiKey: string) {
  // ถ้ามี API Key ให้ยิงตรงไป OpenAI, ถ้าไม่มีให้ลองผ่านเซิร์ฟเวอร์
  const endpoint = apiKey ? 'https://api.openai.com/v1/models' : '/api/models'
  const headers: Record<string, string> = {}
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  logger.debug('openai', 'listModels: request', { endpoint })
  const res = await fetch(endpoint, { headers })
  if (!res.ok) {
    let errText = ''
    try { errText = await res.text() } catch {}
    throw new Error(`HTTP ${res.status}: ${errText}`)
  }
  const json = await res.json()
  logger.debug('openai', 'listModels: response', { count: (json?.data ?? []).length })
  return (json?.data ?? []) as Array<{ id: string }>
}

export type StreamOptions = {
  apiKey: string
  model: string
  systemPrompt?: string
  messages: Message[]
  onChunk: (delta: string) => void
  onUsage?: (usage: OpenAIUsage) => void
  onDone: () => void
  onError: (err: unknown) => void
  abortSignal?: AbortSignal
}

// SSE streaming from chat.completions
export async function streamChat(opts: StreamOptions) {
  const { apiKey, model, systemPrompt, messages, onChunk, onUsage, onDone, onError, abortSignal } = opts
  const body = {
    model,
    stream: true,
    stream_options: {
      include_usage: true
    },
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ]
  }
  logger.info('openai', 'streamChat: request', { hasApiKey: !!apiKey, model, systemPromptLength: (systemPrompt || '').length, messagesCount: messages.length })
  try {
    const safeMessagesPreview = messages.map((m, idx) => ({ idx, role: m.role, len: m.content.length, preview: (m.content || '').slice(0, 200) }))
    const systemPreview = (systemPrompt || '').slice(0, 200)
    logger.debug('openai', 'streamChat: payload preview', { systemPreview, safeMessagesPreview })
  } catch {}

  const decoder = new TextDecoder()
  let buffer = ''

  async function readSseStream(stream: ReadableStream<Uint8Array>) {
    const reader = stream.getReader()
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.replace(/^data:\s*/, '')
        if (data === '[DONE]') {
          logger.info('openai', 'streamChat: done')
          onDone()
          return
        }
        try {
          const json = JSON.parse(data)
          // server proxy ส่ง { delta } ส่วน OpenAI ส่ง choices[].delta.content
          const delta = json?.delta ?? json?.choices?.[0]?.delta?.content ?? ''
          const usage = json?.usage as OpenAIUsage | undefined
          const errMsg = json?.error as string | undefined
          
          if (errMsg) return onError(new Error(errMsg))
          
          if (delta) {
            logger.debug('openai', 'streamChat: chunk', { bytes: (delta as string).length, preview: (delta as string).slice(0, 200) })
            onChunk(delta)
          }
          
          if (usage && onUsage) {
            logger.debug('openai', 'streamChat: usage', { 
              prompt_tokens: usage.prompt_tokens, 
              completion_tokens: usage.completion_tokens, 
              total_tokens: usage.total_tokens 
            })
            onUsage(usage)
          }
        } catch {
          // ignore keepalive
        }
      }
    }
    onDone()
  }

  try {
    if (apiKey) {
      logger.debug('openai', 'streamChat: fetch OpenAI direct')
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
        signal: abortSignal
      })
      if (!res.ok || !res.body) {
        let errText = ''
        try { errText = await res.text() } catch {}
        throw new Error(`HTTP ${res.status}: ${errText}`)
      }
      await readSseStream(res.body)
    } else {
      logger.debug('openai', 'streamChat: fetch via server proxy /api/chat/stream')
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortSignal
      })
      if (!res.ok || !res.body) {
        let errText = ''
        try { errText = await res.text() } catch {}
        throw new Error(`HTTP ${res.status}: ${errText}`)
      }
      await readSseStream(res.body)
    }
  } catch (err) {
    logger.error('openai', 'streamChat: error', { error: String(err) })
    onError(err)
  }
}
