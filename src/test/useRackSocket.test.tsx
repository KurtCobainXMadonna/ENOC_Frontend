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

  it('sends all rack commands via publish', async () => {
    const onEvent = vi.fn()

    const { result, unmount } = renderHook(() => useRackSocket('proj-1', onEvent))

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    const c: any = result.current.client
    // addChannel
    act(() => result.current.addChannel('myName', 'sound-1'))
    expect(c.published).toBeDefined()
    expect(c.published.destination).toContain('/channel/add')
    expect(JSON.parse(c.published.body).name).toBe('myName')

    // removeChannel
    act(() => result.current.removeChannel('ch-1'))
    expect(c.published.destination).toContain('/channel/ch-1/remove')

    // toggleMute
    act(() => result.current.toggleMute('ch-2', true, 50))
    expect(c.published.destination).toContain('/channel/ch-2/update')
    const muteBody = JSON.parse(c.published.body)
    expect(muteBody).toHaveProperty('volume')
    expect(muteBody).toHaveProperty('active')

    // setVolume
    act(() => result.current.setVolume('ch-2', 80, true))
    expect(c.published.destination).toContain('/channel/ch-2/update')

    // lock/unlock
    act(() => result.current.lockChannel('ch-3'))
    expect(c.published.destination).toContain('/channel/ch-3/lock')
    act(() => result.current.unlockChannel('ch-3'))
    expect(c.published.destination).toContain('/channel/ch-3/unlock')

    // setBpm
    act(() => result.current.setBpm(120))
    expect(c.published.destination).toContain('/bpm/update')

    // playback
    act(() => result.current.startPlayback())
    expect(c.published.destination).toContain('/playback/start')
    act(() => result.current.stopPlayback())
    expect(c.published.destination).toContain('/playback/stop')

    unmount()
  })
})
