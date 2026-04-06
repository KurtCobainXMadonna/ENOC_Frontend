import { apiClient } from '../../../shared/api/client';
import { BackendResponse, BackendProject } from '../../../shared/api/types';

interface ProjectsData {
  ownedProjects: BackendProject[];
  collaboratingProjects: BackendProject[];
}

export const projectsApi = {
  getAll: () =>
    apiClient.get<BackendResponse<ProjectsData>>('/api/projects'),

  getById: (projectId: string) =>
    apiClient.get<BackendResponse<BackendProject>>(`/api/projects/${projectId}`),

  create: (name: string) =>
    apiClient.post<BackendResponse<BackendProject>>('/api/projects', { name }),

  delete: (projectId: string) =>
    apiClient.delete<BackendResponse<null>>(`/api/projects/${projectId}`),

  addCollaborator: (projectId: string, email: string) =>
    apiClient.put<BackendResponse<null>>(`/api/projects/${projectId}/collaborators/${encodeURIComponent(email)}`),

  removeCollaborator: (projectId: string, collaboratorId: string) =>
    apiClient.delete<BackendResponse<null>>(`/api/projects/${projectId}/collaborators/${collaboratorId}`),

  createInvite: (projectId: string, inviteeEmail: string) =>
    apiClient.post<BackendResponse<{ inviteToken: string }>>('/api/invites', { projectId, inviteeEmail }),

  acceptInvite: (token: string) =>
    apiClient.post<BackendResponse<null>>(`/api/invites/accept`, null, { params: { token } }),
};