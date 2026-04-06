import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/authStore';

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (cfg: object) => void;
          renderButton: (el: HTMLElement, cfg: object) => void;
        };
      };
    };
  }
}

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const { loginWithGoogle } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initGoogle = () => {
      if (!window.google || !googleBtnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          setLoading(true);
          setError(null);
          try {
            await loginWithGoogle(response.credential);
            onLogin();
          } catch (err) {
            setError('No se pudo iniciar sesión. Intenta de nuevo.');
            console.error(err);
          } finally {
            setLoading(false);
          }
        },
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: googleBtnRef.current.offsetWidth || 276,
        text: 'signin_with',
        shape: 'rectangular',
      });
    };

    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [loginWithGoogle, onLogin]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(155,93,229,0.12) 0%, var(--bg-void) 60%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(var(--neon-violet) 1px, transparent 1px), linear-gradient(90deg, var(--neon-violet) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div style={{ position: 'relative', width: 340, animation: 'slide-up 0.5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52,
            letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--text-primary)',
            textShadow: 'var(--shadow-neon-violet)',
          }}>ZWING</div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--neon-violet)',
            letterSpacing: '0.3em', marginTop: 6, textTransform: 'uppercase',
          }}>
            Plataforma colaborativa de música
          </div>
        </div>

        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)', padding: '32px',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), var(--shadow-neon-violet)',
        }}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 24,
          }}>
            Inicia sesión con tu cuenta de Google para continuar
          </p>

          {/* Google Sign-In button rendered here */}
          <div
            ref={googleBtnRef}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: 44 }}
          />

          {loading && (
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--neon-cyan)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>
              Verificando...
            </p>
          )}

          {error && (
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--neon-pink)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>
              {error}
            </p>
          )}
        </div>

        <p style={{
          textAlign: 'center', fontSize: 10, color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)', marginTop: 16,
        }}>
          Al iniciar sesión, aceptas nuestros términos de uso
        </p>
      </div>
    </div>
  );
}