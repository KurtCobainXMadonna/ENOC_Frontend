import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ---------- silent refresh machinery ----------

let isRefreshing = false;
let pendingQueue: {
  resolve: (cfg: InternalAxiosRequestConfig) => void;
  reject: (err: unknown) => void;
}[] = [];

function processQueue(error: unknown | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    // No need to modify the config — cookies are re-set by the browser
    else resolve(undefined as unknown as InternalAxiosRequestConfig);
  });
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean };

    // Only intercept 401s, skip if it's the refresh call itself or already retried
    if (
      error.response?.status !== 401 ||
      original._retried ||
      original.url === '/auth/refresh' ||
      original.url === '/auth/google'
    ) {
      // If the refresh call itself 401'd, force full logout
      if (original.url === '/auth/refresh') {
        const { useAuthStore } = await import('../../features/auth/store/authStore');
        useAuthStore.getState().forceLogout();
      }
      return Promise.reject(error);
    }

    // If another request is already refreshing, queue this one
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then(() => apiClient(original));
    }

    original._retried = true;
    isRefreshing = true;

    try {
      await apiClient.post('/auth/refresh');
      // Refresh succeeded — browser now has new cookies
      processQueue(null);

      // Notify the session timer to reset
      window.dispatchEvent(new Event('zwing:session-refreshed'));

      return apiClient(original); // retry original request
    } catch (refreshError) {
      processQueue(refreshError);
      // Refresh token also expired → full logout
      const { useAuthStore } = await import('../../features/auth/store/authStore');
      useAuthStore.getState().forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);