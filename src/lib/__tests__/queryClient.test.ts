import { describe, it, expect } from 'vitest'
import { queryClient } from '../queryClient'
import { QueryClient } from '@tanstack/react-query'

describe('queryClient', () => {
  it('is a QueryClient instance', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })

  it('has 5-minute staleTime by default', () => {
    const options = queryClient.getDefaultOptions()
    expect(options.queries?.staleTime).toBe(1000 * 60 * 5)
  })
})
