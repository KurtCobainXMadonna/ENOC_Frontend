import { apiClient } from '../../../shared/api/client';
import { BackendResponse, BackendUser } from '../../../shared/api/types';

interface AuthData extends BackendUser {
  isNewUser: boolean;
}

export const authApi = {
  loginWithGoogle: (idToken: string) =>
    apiClient.post<BackendResponse<AuthData>>('/auth/google', { idToken }),

  logout: () =>
    apiClient.post<BackendResponse<null>>('/auth/logout'),

  getMe: () =>
    apiClient.get<BackendResponse<BackendUser>>('/api/users/me'),

  getUserIdByEmail: (email: string) =>
    apiClient.get<string>(`/api/users/lookup`, { params: { email } }),
};