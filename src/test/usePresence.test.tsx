import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePresence } from '../features/presence/hooks/usePresence'
import { usePresenceStore } from '../features/presence/store/presenceStore'
import { apiClient } from '../shared/api/client'

vi.mock('../shared/api/client')

describe('usePresence hook', () => {
  it('hidrates via REST and subscribes to STOMP events', async () => {
    const roster = [
      { projectId: 'p1', userId: 'u1', email: 'a@x.com', displayName: 'A', color: '#fff', connectedAt: new Date().toISOString() }
    ]

    ;(apiClient.get as any).mockResolvedValueOnce({ data: { data: roster } })

    const fakeSub = { unsubscribe: vi.fn() }
    const fakeClient = { subscribe: vi.fn(() => fakeSub) }

    const { result, unmount } = renderHook(() => usePresence('p1', fakeClient as any, true))

    // esperar que la REST promise se resuelva y setRoster actualice el store
    await waitFor(() => {
      const list = usePresenceStore.getState().asList()
      expect(list.length).toBe(1)
    })

    // Simular mensaje WS y asegurar que setRoster se llama con parsed event
    const cb = (fakeClient.subscribe as any).mock.calls[0][1]
    act(() => cb({ body: JSON.stringify({ type: 'JOINED', roster, changedUserId: 'u1' }) }))

    expect(usePresenceStore.getState().lastEventType).toBe('JOINED')

    unmount()
    expect(fakeSub.unsubscribe).toHaveBeenCalled()
  })
})
