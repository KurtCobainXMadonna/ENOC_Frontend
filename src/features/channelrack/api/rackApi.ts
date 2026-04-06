import { apiClient } from '../../../shared/api/client';
import { BackendResponse, BackendRack } from '../../../shared/api/types';

export const rackApi = {
  getByProject: (projectId: string) =>
    apiClient.get<BackendResponse<BackendRack>>(`/api/rack/${projectId}`),

  updateChannel: (projectId: string, channelId: string, payload: { name?: string; soundId?: string; volume?: number; active?: boolean }) =>
    apiClient.put<BackendResponse<unknown>>(`/api/rack/${projectId}/channels/${channelId}`, payload),

  removeChannel: (projectId: string, channelId: string) =>
    apiClient.delete<BackendResponse<null>>(`/api/rack/${projectId}/channels/${channelId}`),
};