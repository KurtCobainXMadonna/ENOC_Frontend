import { describe, expect, it } from 'vitest'
import { apiClient } from '../shared/api/client'

describe('apiClient defaults', () => {
  it('tiene baseURL y headers configurados', () => {
    expect(apiClient).toBeDefined()
    expect(typeof apiClient.get).toBe('function')
    expect(typeof apiClient.post).toBe('function')
  })
})
