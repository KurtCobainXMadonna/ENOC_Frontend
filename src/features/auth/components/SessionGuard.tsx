import { useEffect, useState, useCallback, useRef } from 'react';
import { INACTIVITY_WARNING_MS, useAuthStore } from '../store/authStore';
import { apiClient } from '../../../shared/api/client';

const WARN_BEFORE_MS = 15 * 60 * 1000 - INACTIVITY_WARNING_MS;

export function SessionGuard() {
  const { user, sessionExpiresAt, resetSessionTimer, forceLogout } = useAuthStore();
  const [showPrompt, setShowPrompt] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const expiryRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const scheduleWarning = useCallback(() => {
    if (!sessionExpiresAt) return;

    // Clear any existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (expiryRef.current) clearTimeout(expiryRef.current);

    const msUntilExpiry = sessionExpiresAt - Date.now();
    const msUntilWarning = msUntilExpiry - WARN_BEFORE_MS;

    if (msUntilWarning > 0) {
      timerRef.current = setTimeout(() => setShowPrompt(true), msUntilWarning);
    } else if (msUntilExpiry > 0) {
      // Already inside the warning window
      setShowPrompt(true);
    }

    // Hard expiry — if they never respond, force logout when refresh token
    // would also be close to expiring. The interceptor handles the actual 401.
  }, [sessionExpiresAt]);

  // Schedule whenever sessionExpiresAt changes
  useEffect(() => {
    setShowPrompt(false);
    scheduleWarning();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (expiryRef.current) clearTimeout(expiryRef.current);
    };
  }, [sessionExpiresAt, scheduleWarning]);

  // Listen for silent refresh events (from the axios interceptor)
  useEffect(() => {
    const handler = () => {
      resetSessionTimer();
      setShowPrompt(false);
    };
    window.addEventListener('zwing:session-refreshed', handler);
    return () => window.removeEventListener('zwing:session-refreshed', handler);
  }, [resetSessionTimer]);

  const handleExtend = async () => {
    try {
      await apiClient.post('/auth/refresh');
      resetSessionTimer();
      setShowPrompt(false);
    } catch {
      forceLogout();
    }
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
  };

  if (!user || !showPrompt) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: 'var(--bg-card, #1a1a2e)',
          border: '1px solid var(--border-subtle, #333)',
          borderRadius: 'var(--radius-xl, 16px)',
          padding: '32px',
          maxWidth: 380,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--text-primary, #fff)',
            marginBottom: 8,
          }}
        >
          Tu sesión está por expirar
        </div>
        <div
          style={{
            fontSize: 14,
            color: 'var(--text-muted, #999)',
            marginBottom: 24,
          }}
        >
          ¿Deseas extender tu sesión?
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={handleExtend}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--neon-violet, #9b5de5)',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Sí, extender
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: '1px solid var(--border-subtle, #333)',
              background: 'transparent',
              color: 'var(--text-muted, #999)',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}