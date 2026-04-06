import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useAuthStore } from '../store/authStore';

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const { login, isLoading } = useAuthStore();

  useGoogleAuth(async (idToken) => {
    try {
      await login(idToken);
      onLogin();
    } catch {
      alert('Error al iniciar sesión. Intenta de nuevo.');
    }
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-void)' }}>
      <div style={{ width: 340, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)', padding: 32, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52,
          letterSpacing: '-0.04em', marginBottom: 32 }}>ZWING</div>
        {isLoading
          ? <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Entrando...</div>
          : <div id="google-btn" />
        }
      </div>
    </div>
  );
}