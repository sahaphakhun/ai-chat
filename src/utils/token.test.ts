import { describe, it, expect } from 'vitest'
import { countTokensText, countTokensConversation } from './token'

describe('token utils', () => {
  it('counts text tokens', () => {
    expect(countTokensText('hello')).toBeGreaterThan(0)
  })
  it('counts conversation tokens split IO', () => {
    const r = countTokensConversation([
      { id: '1', role: 'user', content: 'hi' },
      { id: '2', role: 'assistant', content: 'hello' },
    ])
    expect(r.total).toBeGreaterThan(0)
    expect(r.input).toBeGreaterThan(0)
    expect(r.output).toBeGreaterThan(0)
  })
})
