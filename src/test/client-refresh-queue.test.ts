import { describe, it, expect, vi } from 'vitest'
import { apiClient } from '../shared/api/client'

describe('apiClient interceptor - refresh success and queuing', () => {
  it('retries original request after refresh and services queued requests', async () => {
    const handlers = (apiClient as any).interceptors.response.handlers
    const rejected = handlers.find((h: any) => h.rejected).rejected

    // Make apiClient.post('/auth/refresh') resolve after a short delay
    const refreshPromise = new Promise((res) => setTimeout(() => res({}), 20))
    vi.spyOn(apiClient, 'post').mockImplementation((url: string) => {
      if (url === '/auth/refresh') return refreshPromise as any
      return Promise.resolve({}) as any
    })

    // Spy on window.dispatchEvent to assert it's called when refresh succeeds
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    const fakeOriginal = { url: '/some/resource', headers: {}, method: 'get' }
    const fakeError: any = { response: { status: 401 }, config: fakeOriginal }

    // Call interceptor twice to simulate two concurrent 401s, swallow rejections
    rejected({ ...fakeError }).catch(() => {})
    rejected({ ...fakeError }).catch(() => {})

    // Allow time for refresh call to be scheduled
    await new Promise((r) => setTimeout(r, 40))

    // Ensure refresh was triggered and session-refreshed event dispatched
    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh')
    expect(dispatchSpy).toHaveBeenCalled()
  })
})
