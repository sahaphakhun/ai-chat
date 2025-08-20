import type { OpenAIUsage } from '../types'
import { MODEL_PRICING } from '../constants/modelPricing'

export function costUSD(tokens: number, pricePerK: number): number {
  return (tokens / 1000) * pricePerK
}

export function formatUSD(n: number): string {
  return `$${n.toFixed(6)}`
}

// คำนวณค่าใช้จ่ายจาก OpenAI usage data
export function calculateCostFromUsage(usage: OpenAIUsage, modelName: string): {
  inputCost: number
  outputCost: number
  totalCost: number
  breakdown: {
    regularInputTokens: number
    cachedInputTokens: number
    outputTokens: number
    regularInputCost: number
    cachedInputCost: number
    outputCost: number
  }
} {
  const modelPricing = MODEL_PRICING.find(m => m.name === modelName)
  if (!modelPricing) {
    // fallback ถ้าไม่เจอโมเดล ใช้ราคา gpt-4o-mini
    console.warn(`Model ${modelName} not found in pricing table, using gpt-4o-mini pricing`)
    return calculateCostFromUsage(usage, 'gpt-4o-mini')
  }

  const cachedTokens = usage.prompt_tokens_details?.cached_tokens ?? 0
  const regularInputTokens = usage.prompt_tokens - cachedTokens
  const outputTokens = usage.completion_tokens

  const regularInputCost = costUSD(regularInputTokens, modelPricing.inK)
  const cachedInputCost = modelPricing.cachedInK ? costUSD(cachedTokens, modelPricing.cachedInK) : 0
  const outputCost = costUSD(outputTokens, modelPricing.outK)

  const inputCost = regularInputCost + cachedInputCost
  const totalCost = inputCost + outputCost

  return {
    inputCost,
    outputCost,
    totalCost,
    breakdown: {
      regularInputTokens,
      cachedInputTokens: cachedTokens,
      outputTokens,
      regularInputCost,
      cachedInputCost,
      outputCost
    }
  }
}
