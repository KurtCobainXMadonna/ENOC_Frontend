import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useProjects } from '../features/projects/hooks/useProjects'
import { apiClient } from '../shared/api/client'

vi.mock('../shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedGet = vi.mocked(apiClient.get)
const mockedPost = vi.mocked(apiClient.post)
const mockedDelete = vi.mocked(apiClient.delete)

describe('useProjects', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPost.mockReset()
    mockedDelete.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('separa proyectos propios y colaborativos desde una lista plana', async () => {
    mockedGet.mockResolvedValueOnce({
      data: [
        {
          id: 'p-owned',
          name: 'Mix One',
          owner: 'Ana',
          updatedAt: new Date().toISOString(),
          isOwner: true,
          collaborators: ['u-2'],
          projectOwner: { name: 'Ana' },
        },
        {
          projectId: 'p-collab',
          projectName: 'Session Two',
          ownerName: 'Bob',
          lastModified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          isOwner: false,
          collaborators: [],
        },
      ],
    })

    const { result } = renderHook(() => useProjects())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.ownedProjects).toHaveLength(1)
    expect(result.current.ownedProjects[0]).toMatchObject({
      id: 'p-owned',
      name: 'Mix One',
      owner: 'Ana',
      isOwner: true,
    })
    expect(result.current.ownedProjects[0].lastModified).toBe('Ahora mismo')

    expect(result.current.collaboratingProjects).toHaveLength(1)
    expect(result.current.collaboratingProjects[0]).toMatchObject({
      id: 'p-collab',
      name: 'Session Two',
      owner: 'Bob',
      isOwner: false,
    })

    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const expectedDate = tenDaysAgo.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
    })
    expect(result.current.collaboratingProjects[0].lastModified).toBe(expectedDate)
  })

  it('crea, elimina y recarga proyectos usando la forma agrupada de respuesta', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          ownedProjects: [
            {
              projectId: 'p-1',
              projectName: 'Starter',
              projectOwner: { name: 'Tú' },
              updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
          ],
          collaboratingProjects: [],
        },
      },
    })

    mockedPost.mockResolvedValueOnce({
      data: {
        data: {
          projectId: 'p-2',
          projectName: 'Created',
          projectOwner: { name: 'Maria' },
          updatedAt: new Date().toISOString(),
        },
      },
    })

    mockedDelete.mockResolvedValueOnce({ data: {} })

    const { result } = renderHook(() => useProjects())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let createdProject: Awaited<ReturnType<typeof result.current.createProject>> | undefined
    await act(async () => {
      createdProject = await result.current.createProject('Created')
    })

    expect(createdProject).toMatchObject({
      id: 'p-2',
      name: 'Created',
      owner: 'Maria',
      isOwner: true,
    })
    expect(mockedPost).toHaveBeenCalledWith('/api/projects', { name: 'Created' })
    expect(result.current.ownedProjects[0].id).toBe('p-2')

    await act(async () => {
      await result.current.deleteProject('p-2')
    })

    expect(mockedDelete).toHaveBeenCalledWith('/api/projects/p-2')
    expect(result.current.ownedProjects).toHaveLength(1)
    expect(result.current.ownedProjects[0].id).toBe('p-1')

    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          ownedProjects: [
            {
              projectId: 'p-3',
              projectName: 'Joined project',
              projectOwner: { name: 'Team' },
              updatedAt: new Date().toISOString(),
            },
          ],
          collaboratingProjects: [],
        },
      },
    })

    await act(async () => {
      await result.current.joinProject('  invite-123  ')
    })

    expect(mockedPost).toHaveBeenCalledWith('/api/invites/accept', null, {
      params: { token: 'INVITE-123' },
    })
    expect(mockedGet).toHaveBeenCalledTimes(2)
    expect(result.current.ownedProjects[0].id).toBe('p-3')
  })

  it('expone error cuando la carga inicial falla', async () => {
    mockedGet.mockRejectedValueOnce({
      response: { data: { message: 'No se pudo cargar' } },
    })

    const { result } = renderHook(() => useProjects())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('No se pudo cargar')
    expect(result.current.ownedProjects).toHaveLength(0)
    expect(result.current.collaboratingProjects).toHaveLength(0)
  })
})