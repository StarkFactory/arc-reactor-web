import { describe, it, expect } from 'vitest'

describe('test infrastructure', () => {
  it('vitest runs correctly', () => {
    expect(1 + 1).toBe(2)
  })

  it('jest-dom matchers are available', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    document.body.appendChild(el)
    expect(el).toBeInTheDocument()
    document.body.removeChild(el)
  })
})
