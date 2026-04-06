import { create } from 'zustand';
import { authApi } from '../api/authApi';

interface User {
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  loginWithGoogle: async (idToken: string) => {
    set({ error: null });
    const { data } = await authApi.loginWithGoogle(idToken);
    set({
      user: { name: data.data.name, email: data.data.email },
      isAuthenticated: true,
      error: null,
    });
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.getMe();
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));