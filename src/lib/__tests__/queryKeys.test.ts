import { describe, it, expect } from 'vitest'
import { queryKeys } from '../queryKeys'

describe('queryKeys', () => {
  it('personas keys are stable and unique', () => {
    expect(queryKeys.personas.all()).toEqual(['personas'])
    expect(queryKeys.personas.list()).toEqual(['personas', 'list'])
    expect(queryKeys.personas.detail('abc')).toEqual(['personas', 'detail', 'abc'])
  })

  it('intents keys are stable and unique', () => {
    expect(queryKeys.intents.all()).toEqual(['intents'])
    expect(queryKeys.intents.list()).toEqual(['intents', 'list'])
    expect(queryKeys.intents.detail('xyz')).toEqual(['intents', 'detail', 'xyz'])
  })

  it('clipping stats key includes yearMonth and optional categoryId', () => {
    expect(queryKeys.clipping.stats('2024-01')).toEqual([
      'clipping', 'stats', '2024-01', undefined,
    ])
    expect(queryKeys.clipping.stats('2024-01', 'cat-1')).toEqual([
      'clipping', 'stats', '2024-01', 'cat-1',
    ])
  })

  it('keys from different domains do not clash', () => {
    const personasList = JSON.stringify(queryKeys.personas.list())
    const intentsList = JSON.stringify(queryKeys.intents.list())
    expect(personasList).not.toBe(intentsList)
  })
})
