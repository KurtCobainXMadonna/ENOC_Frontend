import { describe, expect, it, vi } from 'vitest'

// Mock the stompjs Client and sockjs-client to avoid real network
vi.mock('@stomp/stompjs', () => ({
  Client: class {
    activate() { /* noop */ }
    deactivate() { /* noop */ }
    // stub properties
    onConnect?: () => void
    onDisconnect?: () => void
    onStompError?: (frame: any) => void
    constructor(opts?: any) { if (opts?.onConnect) setTimeout(opts.onConnect, 0) }
  }
}))

vi.mock('sockjs-client', () => ({ default: function SockJSMock() { return {} } }))

import { createStompClient, getStompClient } from '../shared/websocket/stompClient'

describe('stompClient', () => {
  it('crea y recupera cliente STOMP', () => {
    const client = createStompClient(() => {})
    expect(client).toBeDefined()
    const fromGet = getStompClient()
    expect(fromGet).toBe(client)
  })
})
