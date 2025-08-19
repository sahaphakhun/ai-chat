import type { Message } from '../types'

export async function listModels(apiKey: string) {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return (json?.data ?? []) as Array<{ id: string }>
}

export type StreamOptions = {
  apiKey: string
  model: string
  systemPrompt?: string
  messages: Message[]
  onChunk: (delta: string) => void
  onDone: () => void
  onError: (err: unknown) => void
  abortSignal?: AbortSignal
}

// SSE streaming from chat.completions
export async function streamChat(opts: StreamOptions) {
  const { apiKey, model, systemPrompt, messages, onChunk, onDone, onError, abortSignal } = opts
  const body = {
    model,
    stream: true,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ]
  }
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(body),
      signal: abortSignal
    })
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

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
          onDone()
          return
        }
        try {
          const json = JSON.parse(data)
          const delta = json?.choices?.[0]?.delta?.content ?? ''
          if (delta) onChunk(delta)
        } catch { /* ignore JSON parse in keepalive */ }
      }
    }
    onDone()
  } catch (err) {
    onError(err)
  }
}
