import type { ModelName } from './constants/modelPricing'

export type Role = 'system' | 'user' | 'assistant'

// OpenAI API usage data structure
export type OpenAIUsage = {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  prompt_tokens_details?: {
    cached_tokens?: number
    audio_tokens?: number
  }
  completion_tokens_details?: {
    reasoning_tokens?: number
    audio_tokens?: number
    accepted_prediction_tokens?: number
    rejected_prediction_tokens?: number
  }
}

export type Message = { 
  id: string
  role: Role
  content: string
  tokens?: number
  // เพิ่มข้อมูล usage จาก OpenAI API (สำหรับ assistant messages)
  usage?: OpenAIUsage
}
export type Conversation = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
  model: ModelName
}

export type Settings = {
  apiKey: string
  systemPrompt: string
  model: ModelName
  inPricePerK: number
  outPricePerK: number
  theme: 'light' | 'dark'
}
