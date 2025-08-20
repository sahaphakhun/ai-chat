import type { TokenUsage } from '../types'

export function costUSD(tokens: number, pricePerK: number): number {
  return (tokens / 1000) * pricePerK
}

export function costFromUsage(
  usage: TokenUsage, 
  inPricePerK: number, 
  outPricePerK: number, 
  cachedInPricePerK?: number
): number {
  const inputCost = costUSD(usage.prompt_tokens, inPricePerK)
  const outputCost = costUSD(usage.completion_tokens, outPricePerK)
  const cachedCost = usage.cached_tokens && cachedInPricePerK 
    ? costUSD(usage.cached_tokens, cachedInPricePerK) 
    : 0
  
  return inputCost + outputCost + cachedCost
}

export function formatUSD(n: number): string {
  return `$${n.toFixed(6)}`
}

export function formatUsageBreakdown(
  usage: TokenUsage,
  inPricePerK: number,
  outPricePerK: number,
  cachedInPricePerK?: number
): {
  inputCost: number
  outputCost: number
  cachedCost: number
  totalCost: number
  breakdown: string
} {
  const inputCost = costUSD(usage.prompt_tokens, inPricePerK)
  const outputCost = costUSD(usage.completion_tokens, outPricePerK)
  const cachedCost = usage.cached_tokens && cachedInPricePerK 
    ? costUSD(usage.cached_tokens, cachedInPricePerK) 
    : 0
  const totalCost = inputCost + outputCost + cachedCost
  
  let breakdown = `Input: ${usage.prompt_tokens.toLocaleString()} tokens = ${formatUSD(inputCost)}`
  breakdown += `\nOutput: ${usage.completion_tokens.toLocaleString()} tokens = ${formatUSD(outputCost)}`
  
  if (usage.cached_tokens && cachedCost > 0) {
    breakdown += `\nCached: ${usage.cached_tokens.toLocaleString()} tokens = ${formatUSD(cachedCost)}`
  }
  
  breakdown += `\nTotal: ${formatUSD(totalCost)}`
  
  return { inputCost, outputCost, cachedCost, totalCost, breakdown }
}
