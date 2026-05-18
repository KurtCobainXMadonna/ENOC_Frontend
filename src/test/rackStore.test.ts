// src/test/rackStore.test.ts
// Tests unitarios para el store de Zustand del rack

import { describe, it, expect, beforeEach } from 'vitest'
import { useRackStore } from '../features/channelrack/store/rackStore'

describe('rackStore', () => {
  beforeEach(() => {
    // Resetear el store antes de cada test
    useRackStore.setState({
      rackId: null,
      channels: [],
      version: 0,
    })
  })

  it('debe inicializarse con valores vacíos', () => {
    const state = useRackStore.getState()
    expect(state.rackId).toBeNull()
    expect(state.channels).toHaveLength(0)
    expect(state.version).toBe(0)
  })

  it('debe cargar el rack con setRack', () => {
    const mockRack = {
      rackId: 'rack-123',
      channels: [
        {
          id: 'ch-1',
          name: 'Kick 1',
          sampleId: 'sound-1',
          volume: 80,
          isMute: false,
          steps: Array(16).fill(false),
        },
      ],
      version: 1,
    }

    useRackStore.getState().setRack(mockRack)
    const state = useRackStore.getState()

    expect(state.rackId).toBe('rack-123')
    expect(state.channels).toHaveLength(1)
    expect(state.channels[0].name).toBe('Kick 1')
    expect(state.version).toBe(1)
  })

  it('debe agregar un canal con applyAction addChannel', () => {
    useRackStore.getState().applyAction('addChannel', {
      channelId: 'ch-nuevo',
      name: 'Snare 1',
      sampleId: 'sound-2',
    })

    const state = useRackStore.getState()
    expect(state.channels).toHaveLength(1)
    expect(state.channels[0].id).toBe('ch-nuevo')
    expect(state.channels[0].name).toBe('Snare 1')
    expect(state.channels[0].steps).toHaveLength(16)
    expect(state.channels[0].steps.every((s: boolean) => s === false)).toBe(true)
  })

  it('debe eliminar un canal con applyAction removeChannel', () => {
    // Primero agregar
    useRackStore.getState().applyAction('addChannel', {
      channelId: 'ch-1',
      name: 'Kick',
      sampleId: 's1',
    })
    useRackStore.getState().applyAction('addChannel', {
      channelId: 'ch-2',
      name: 'Snare',
      sampleId: 's2',
    })

    // Luego eliminar
    useRackStore.getState().applyAction('removeChannel', { channelId: 'ch-1' })

    const state = useRackStore.getState()
    expect(state.channels).toHaveLength(1)
    expect(state.channels[0].id).toBe('ch-2')
  })

  it('debe activar un paso con applyAction activateStep', () => {
    useRackStore.getState().applyAction('addChannel', {
      channelId: 'ch-1',
      name: 'Kick',
      sampleId: 's1',
    })
    useRackStore.getState().applyAction('activateStep', {
      channelId: 'ch-1',
      stepIndex: 0,
    })

    const state = useRackStore.getState()
    expect(state.channels[0].steps[0]).toBe(true)
    // Los demás deben seguir en false
    expect(state.channels[0].steps[1]).toBe(false)
  })

  it('debe desactivar un paso con applyAction deactivateStep', () => {
    useRackStore.getState().applyAction('addChannel', {
      channelId: 'ch-1',
      name: 'Kick',
      sampleId: 's1',
    })
    // Activar primero
    useRackStore.getState().applyAction('activateStep', {
      channelId: 'ch-1',
      stepIndex: 3,
    })
    expect(useRackStore.getState().channels[0].steps[3]).toBe(true)

    // Desactivar
    useRackStore.getState().applyAction('deactivateStep', {
      channelId: 'ch-1',
      stepIndex: 3,
    })
    expect(useRackStore.getState().channels[0].steps[3]).toBe(false)
  })

  it('no debe modificar el estado con una acción desconocida', () => {
    useRackStore.getState().applyAction('addChannel', {
      channelId: 'ch-1',
      name: 'Kick',
      sampleId: 's1',
    })

    useRackStore.getState().applyAction('accionDesconocida', {})

    const state = useRackStore.getState()
    expect(state.channels).toHaveLength(1)
  })
})