export function costUSD(tokens: number, pricePerK: number): number {
  return (tokens / 1000) * pricePerK
}
export function formatUSD(n: number): string {
  return `$${n.toFixed(6)}`
}
