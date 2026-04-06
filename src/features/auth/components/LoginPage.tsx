import { useEffect, useRef, useState } from 'react';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void | Promise<void>;
  }) => void;
  renderButton: (parent: HTMLElement, options: { theme: string; size: string; width: number }) => void;
};

type WindowWithGoogle = Window & {
  google?: {
    accounts?: {
      id?: GoogleAccountsId;
    };
  };
};

export function LoginPage({ onLogin }: { onLogin: () => void }) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const { loginWithGoogle } = useGoogleAuth();

  useEffect(() => {
    if (isRegister) {
      return;
    }

    try {
      const googleAccountsId = (window as WindowWithGoogle).google?.accounts?.id;
      if (!googleAccountsId || !googleButtonRef.current || !googleClientId) {
        if (!googleClientId) {
          console.error('Missing VITE_GOOGLE_CLIENT_ID in frontend environment variables.');
        }
        return;
      }

      googleButtonRef.current.innerHTML = '';

      googleAccountsId.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          try {
            await loginWithGoogle(credential);
            onLogin();
          } catch (error) {
            console.error('Google login failed', error);
          }
        },
      });

      googleAccountsId.renderButton(googleButtonRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: 300,
      });
    } catch (error) {
      console.error('Google SDK init failed', error);
    }
  }, [googleClientId, isRegister, loginWithGoogle, onLogin]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(155,93,229,0.12) 0%, var(--bg-void) 60%)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(var(--neon-violet) 1px, transparent 1px), linear-gradient(90deg, var(--neon-violet) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--neon-violet), transparent)', opacity: 0.3, animation: 'scanline 6s linear infinite' }} />

      <div style={{ position: 'relative', width: 340, animation: 'slide-up 0.5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--text-primary)', textShadow: 'var(--shadow-neon-violet)' }}>ZWING</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--neon-violet)', letterSpacing: '0.3em', marginTop: 6, textTransform: 'uppercase' }}>
            {isRegister ? 'Crea una cuenta en' : 'Bienvenido a'}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: '0 40px 80px rgba(0,0,0,0.5), var(--shadow-neon-violet)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isRegister && (
              <div>
                <label className="label">Nombre de usuario</label>
                <input className="input" placeholder="tu_nombre" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div>
              <label className="label">Correo electrónico *</label>
              <input className="input" type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Contraseña *</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {isRegister && (
              <div>
                <label className="label">Confirmar contraseña *</label>
                <input className="input" type="password" placeholder="••••••••" />
              </div>
            )}
            {isRegister ? (
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: 4 }} onClick={onLogin}>
                Registrarse
              </button>
            ) : (
              <div ref={googleButtonRef} style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }} />
            )}
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
              <button onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: 'var(--neon-violet)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                {isRegister ? 'Inicia sesión' : 'Crear una'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}