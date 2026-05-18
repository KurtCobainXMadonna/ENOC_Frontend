import { create } from 'zustand';

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes — matches backend
export const INACTIVITY_WARNING_MS = 12 * 60 * 1000; // show prompt at 12 min

interface AuthState {
  user: { name: string; email: string } | null;
  isLoading: boolean;
  sessionExpiresAt: number | null; // epoch ms when the access token expires
  login: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  fetchMe: () => Promise<void>;
  resetSessionTimer: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  sessionExpiresAt: null,

  login: async (idToken: string) => {
    set({ isLoading: true });
    const { apiClient } = await import('../../../shared/api/client');
    const { data } = await apiClient.post('/auth/google', { idToken });
    set({
      user: { name: data.data.name, email: data.data.email },
      isLoading: false,
      sessionExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
    });
  },

  logout: async () => {
    try {
      const { apiClient } = await import('../../../shared/api/client');
      await apiClient.post('/auth/logout');
    } catch {
      // If logout fails (e.g. already expired), still clear local state
    }
    set({ user: null, sessionExpiresAt: null });
  },

  forceLogout: () => {
    set({ user: null, sessionExpiresAt: null });
  },

  fetchMe: async () => {
    const { apiClient } = await import('../../../shared/api/client');
    const { data } = await apiClient.get('/api/users/me');
    set({
      user: { name: data.data.name, email: data.data.email },
      sessionExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS,
    });
  },

  resetSessionTimer: () => {
    set({ sessionExpiresAt: Date.now() + ACCESS_TOKEN_TTL_MS });
  },
}));