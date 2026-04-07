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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(155,93,229,0.12) 0%, var(--bg-void) 60%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>
        {`
          @keyframes login-scanline {
            0% { transform: translateY(-18vh); }
            100% { transform: translateY(70vh); }
          }

          @keyframes login-slide-up {
            0% { opacity: 0; transform: translateY(18px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}
      </style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            'linear-gradient(var(--neon-violet) 1px, transparent 1px), linear-gradient(90deg, var(--neon-violet) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '28%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--neon-violet), transparent)',
          opacity: 0.3,
          pointerEvents: 'none',
          animation: 'login-scanline 6s linear infinite',
        }}
      />

      <div style={{ width: 340, position: 'relative', animation: 'login-slide-up 520ms ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 52,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: 'var(--text-primary)',
              textShadow: 'var(--shadow-neon-violet)',
            }}
          >
            ZWING
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--neon-violet)',
              letterSpacing: '0.3em',
              marginTop: 6,
              textTransform: 'uppercase',
            }}
          >
            Bienvenido a
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: 32,
            textAlign: 'center',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5), var(--shadow-neon-violet)',
          }}
        >
          {isLoading ? (
            <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Entrando...</div>
          ) : (
            <div id="google-btn" />
          )}
        </div>
      </div>
    </div>
  );
}