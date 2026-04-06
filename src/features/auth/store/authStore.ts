import { create } from 'zustand';

interface AuthState {
  user: { name: string; email: string } | null;
  isLoading: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  login: async (idToken: string) => {
    set({ isLoading: true });
    const { apiClient } = await import('../../../shared/api/client');
    const { data } = await apiClient.post('/auth/google', { idToken });
    set({ user: { name: data.data.name, email: data.data.email }, isLoading: false });
  },

  logout: async () => {
    const { apiClient } = await import('../../../shared/api/client');
    await apiClient.post('/auth/logout');
    set({ user: null });
  },

  fetchMe: async () => {
    const { apiClient } = await import('../../../shared/api/client');
    const { data } = await apiClient.get('/api/users/me');
    set({ user: { name: data.data.name, email: data.data.email } });
  },
}));