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
  let totalFromAPI = 0
  let hasAPIData = false
  
  for (const m of messages) {
    if (m.role === 'assistant' && m.usage) {
      // ใช้ข้อมูลจาก OpenAI API ถ้ามี
      output += m.usage.completion_tokens
      hasAPIData = true
      totalFromAPI += m.usage.total_tokens
    } else {
      // fallback ไปใช้การคำนวณเอง
      const t = countTokensMessage(m)
      if (m.role === 'assistant') output += t
      else input += t
    }
  }
  
  // ถ้ามีข้อมูลจาก API บางส่วน ให้คำนวณ input tokens จากข้อมูลที่มี
  if (hasAPIData) {
    // หา input tokens จากข้อความที่ไม่ใช่ assistant หรือจาก usage data
    input = 0
    for (const m of messages) {
      if (m.role !== 'assistant') {
        input += countTokensMessage(m)
      }
    }
  }
  
  return { input, output, total: input + output }
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
