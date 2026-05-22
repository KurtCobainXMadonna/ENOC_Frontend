import { beforeEach, describe, expect, it } from 'vitest'
import { usePresenceStore } from '../features/presence/store/presenceStore'
import type { Presence } from '../features/presence/types/presence'

describe('presenceStore', () => {
  const roster: Presence[] = [
    {
      projectId: 'proj-1',
      userId: 'u-1',
      email: 'ana@example.com',
      displayName: 'Ana',
      color: '#ff0000',
      connectedAt: '2026-05-21T12:00:00Z',
    },
    {
      projectId: 'proj-1',
      userId: 'u-2',
      email: 'bruno@example.com',
      displayName: '',
      color: '#00ff00',
      connectedAt: '2026-05-21T12:01:00Z',
    },
  ]

  beforeEach(() => {
    usePresenceStore.setState({
      roster: {},
      lastChangedUserId: null,
      lastEventType: null,
    })
  })

  it('normaliza el roster y expone helpers de color, nombre y lista', () => {
    usePresenceStore.getState().setRoster(roster, 'JOINED', 'u-1')

    const state = usePresenceStore.getState()

    expect(state.lastEventType).toBe('JOINED')
    expect(state.lastChangedUserId).toBe('u-1')
    expect(state.asList()).toHaveLength(2)
    expect(state.colorFor('u-1')).toBe('#ff0000')
    expect(state.colorFor('u-2')).toBe('#00ff00')
    expect(state.nameFor('u-1')).toBe('Ana')
    expect(state.nameFor('u-2')).toBe('')
    expect(state.colorFor(undefined)).toBeUndefined()
    expect(state.nameFor(null)).toBeUndefined()
  })

  it('clear deja el estado listo para otro proyecto', () => {
    usePresenceStore.getState().setRoster(roster, 'ROSTER_SNAPSHOT', 'u-2')
    usePresenceStore.getState().clear()

    const state = usePresenceStore.getState()
    expect(state.roster).toEqual({})
    expect(state.lastChangedUserId).toBeNull()
    expect(state.lastEventType).toBeNull()
    expect(state.asList()).toHaveLength(0)
  })
})