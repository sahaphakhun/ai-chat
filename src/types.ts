import type { ModelName } from './constants/modelPricing'

export type Role = 'system' | 'user' | 'assistant'
export type Message = { id: string; role: Role; content: string; tokens?: number }
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
