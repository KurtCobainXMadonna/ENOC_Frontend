import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useGoogleAuth } from '../features/auth/hooks/useGoogleAuth'

describe('useGoogleAuth', () => {
  it('llama a initialize y renderButton cuando el script carga', async () => {
    const initialize = vi.fn()
    const renderButton = vi.fn()
    ;(window as any).google = { accounts: { id: { initialize, renderButton } } }

    // asegurarnos que hay un target para renderButton
    const container = document.createElement('div')
    container.id = 'google-btn'
    document.body.appendChild(container)

    const tokenCb = vi.fn()
    const { unmount } = renderHook(() => useGoogleAuth(tokenCb))

    const script = Array.from(document.getElementsByTagName('script')).find(s => (s as HTMLScriptElement).src.includes('accounts.google.com')) as HTMLScriptElement
    expect(script).toBeDefined()
    // Simular carga
    script.onload && script.onload(new Event('load'))

    expect(initialize).toHaveBeenCalled()
    expect(renderButton).toHaveBeenCalled()

    unmount()
    document.body.removeChild(container)
  })
})
