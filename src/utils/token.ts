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
  // ตรวจสอบว่ามีข้อมูลจาก API หรือไม่
  const assistantMessages = messages.filter(m => m.role === 'assistant')
  const messagesWithUsage = assistantMessages.filter(m => m.usage)
  const hasCompleteAPIData = messagesWithUsage.length === assistantMessages.length && assistantMessages.length > 0
  
  if (hasCompleteAPIData) {
    // ใช้ข้อมูลจาก OpenAI API
    let input = 0
    let output = 0
    
    for (const m of messages) {
      if (m.role === 'assistant' && m.usage) {
        input += m.usage.prompt_tokens
        output += m.usage.completion_tokens
      }
    }
    
    return { input, output, total: input + output }
  } else {
    // ไม่มีข้อมูลจาก API ให้ return 0 แทนการคำนวณที่เพี้ยน
    return { input: 0, output: 0, total: 0 }
  }
}

// ฟังก์ชันใหม่สำหรับคำนวณจาก usage data อย่างเดียว
export function countTokensFromUsage(messages: Message[]): {
  input: number
  output: number
  total: number
  cached: number
  hasCompleteAPIData: boolean
} {
  let totalInput = 0
  let totalOutput = 0
  let totalCached = 0
  let messagesWithUsage = 0
  
  for (const m of messages) {
    if (m.role === 'assistant' && m.usage) {
      totalInput += m.usage.prompt_tokens
      totalOutput += m.usage.completion_tokens
      totalCached += m.usage.prompt_tokens_details?.cached_tokens ?? 0
      messagesWithUsage++
    }
  }
  
  const assistantMessages = messages.filter(m => m.role === 'assistant').length
  const hasCompleteAPIData = messagesWithUsage === assistantMessages && assistantMessages > 0
  
  return {
    input: totalInput,
    output: totalOutput,
    total: totalInput + totalOutput,
    cached: totalCached,
    hasCompleteAPIData
  }
}
