import { encode } from 'gpt-tokenizer'
import type { Message } from '../types'

export function countTokensText(text: string): number {
  try {
    return encode(text).length
  } catch {
    // worst-case fallback: 4 chars per token heuristic
    return Math.ceil(text.length / 4)
  }
}

export function countTokensMessage(m: Message): number {
  return countTokensText(m.content)
}

export function countTokensConversation(messages: Message[]) {
  let input = 0
  let output = 0
  for (const m of messages) {
    const t = countTokensMessage(m)
    if (m.role === 'assistant') output += t
    else input += t
  }
  return { input, output, total: input + output }
}
