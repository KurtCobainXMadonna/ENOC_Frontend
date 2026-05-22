import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

// Mock stompjs Client and sockjs-client similar to runtime
vi.mock('@stomp/stompjs', () => ({
  Client: class {
    connected = false
    handlers: Record<string, (msg: any) => void> = {}
    constructor(opts?: any) {
      // save callbacks
      if (opts?.onConnect) {
        // call onConnect asynchronously to simulate connect
        setTimeout(() => {
          this.connected = true
          opts.onConnect()
        }, 0)
      }
      if (opts?.onDisconnect) this.onDisconnect = opts.onDisconnect
    }
    subscribe(dest: string, cb: (m: any) => void) { this.handlers[dest] = cb }
    publish(opts: any) { this.published = opts }
    activate() { /* noop */ }
    deactivate() { /* noop */ }
    onDisconnect?: () => void
    onStompError?: (frame: any) => void
    published?: any
  }
}))

vi.mock('sockjs-client', () => ({ default: function SockJSMock() { return {} } }))

import { useRackSocket } from '../features/channelrack/hooks/useRackSocket'

describe('useRackSocket hook', () => {
  it('connects and exposes client/connected and publishes commands', async () => {
    const onEvent = vi.fn()

    const { result, unmount } = renderHook(() => useRackSocket('proj-1', onEvent))

    // wait for the async onConnect in the mock inside an act
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    expect(result.current.client).toBeDefined()
    expect(result.current.connected).toBe(true)

    // toggleStep should call publish when connected
    const c: any = result.current.client
    result.current.toggleStep('ch1', 3)
    expect(c.published).toBeDefined()
    expect(c.published.destination).toContain('/channel/ch1/step')

    // cleanup: unmount hook to trigger deactivate
    unmount()
  })
})
