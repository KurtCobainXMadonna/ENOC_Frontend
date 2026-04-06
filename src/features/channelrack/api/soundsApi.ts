import { apiClient } from '../../../shared/api/client';
import { BackendResponse, BackendSound, SoundCategory } from '../../../shared/api/types';

export const soundsApi = {
  getAll: () =>
    apiClient.get<BackendResponse<BackendSound[]>>('/api/sounds'),

  getByCategory: (category: SoundCategory) =>
    apiClient.get<BackendResponse<BackendSound[]>>('/api/sounds', { params: { category } }),
};