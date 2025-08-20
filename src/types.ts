import type { ModelName } from './constants/modelPricing'

export type Role = 'system' | 'user' | 'assistant'

export type TokenUsage = {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cached_tokens?: number
}

export type Message = { 
  id: string
  role: Role
  content: string
  tokens?: number // Legacy estimated tokens
  actualUsage?: TokenUsage // Actual usage from OpenAI API
}

export type Conversation = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
  model: ModelName
  totalUsage?: TokenUsage // Accumulated actual usage for the conversation
}

export type PricingTier = 'standard' | 'flex' | 'batch'

export type Settings = {
  apiKey: string
  systemPrompt: string
  model: ModelName
  pricingTier: PricingTier
  inPricePerK: number
  outPricePerK: number
  cachedInPricePerK?: number
  theme: 'light' | 'dark'
}
