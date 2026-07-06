import { describe, it, expect } from 'vitest'
import { storage } from '~/utils/storage'

describe('storage helper', () => {
  it('returns the fallback when the key is absent', () => {
    expect(storage.get('missing', 'fb')).toBe('fb')
    expect(storage.get<number>('count', 7)).toBe(7)
  })

  it('round-trips JSON values', () => {
    storage.set('list', [1, 2, 3])
    expect(storage.get<number[]>('list', [])).toEqual([1, 2, 3])
  })

  it('removes keys', () => {
    storage.set('temp', 'v')
    storage.remove('temp')
    expect(storage.get('temp', null)).toBeNull()
  })

  it('survives malformed JSON by returning the fallback', () => {
    window.localStorage.setItem('todos:bad', '{not json')
    expect(storage.get('bad', 'safe')).toBe('safe')
  })
})
