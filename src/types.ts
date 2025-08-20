import type { ModelName } from './constants/modelPricing'

export type Role = 'system' | 'user' | 'assistant'

export type Message = {
  id: string
  role: Role
  content: string
  tokens?: number
  createdAt: number
}

export type Conversation = {
  id: string
  title: string
  messages: Message[]
  model: string
  createdAt: number
  updatedAt: number
}

export type Settings = {
  apiKey: string
  systemPrompt: string
  model: string
  inPricePerK: number
  outPricePerK: number
  theme: 'light' | 'dark'
}

export type ChatState = {
  conversations: Record<string, Conversation>
  currentConversationId: string | null
  isLoading: boolean
  error: string | null
}
