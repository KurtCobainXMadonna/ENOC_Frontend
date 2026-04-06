import { api } from '../../../shared/api/client';

export function useGoogleAuth() {
  const loginWithGoogle = (credential: string) =>
    api.post('/auth/google', { idToken: credential });

  return { loginWithGoogle };
}