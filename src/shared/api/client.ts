import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // JWT is stored in httpOnly cookie
  headers: { 'Content-Type': 'application/json' },
});

// Intercept 401 — force re-login
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.includes('login')) {
      window.location.reload();
    }
    return Promise.reject(err);
  },
);