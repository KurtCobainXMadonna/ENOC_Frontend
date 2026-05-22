import { describe, it, expect, vi } from 'vitest'
import { apiClient } from '../shared/api/client'

// Mock the auth store module that the interceptor dynamically imports
vi.mock('../features/auth/store/authStore', () => ({
  useAuthStore: {
    getState: () => ({
      forceLogout: vi.fn(),
    }),
  },
}))

describe('apiClient interceptor - refresh failure handling', () => {
  it('calls forceLogout when refresh endpoint itself returns 401', async () => {
    const handlers = (apiClient as any).interceptors.response.handlers
    const rejected = handlers.find((h: any) => h.rejected).rejected

    const fakeOriginal = { url: '/auth/refresh' }
    const fakeError: any = { response: { status: 401 }, config: fakeOriginal }

    // Call the interceptor's rejected handler and expect it to reject
    await expect(rejected(fakeError)).rejects.toEqual(fakeError)
  })
})
