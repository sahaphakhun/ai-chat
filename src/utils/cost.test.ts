import { describe, it, expect } from 'vitest'
import { costUSD } from './cost'

describe('cost utils', () => {
  it('computes proportional to tokens', () => {
    expect(costUSD(1000, 0.003)).toBeCloseTo(0.003)
    expect(costUSD(500, 0.003)).toBeCloseTo(0.0015)
  })
})
