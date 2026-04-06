import { useEffect } from 'react';
import { LoginPage } from '../features/auth/components/LoginPage';
import { Dashboard } from '../features/projects/components/Dashboard';
import { ChannelRackPage } from '../features/channelrack/components/ChannelRack';
import { useAuthStore } from '../features/auth/store/authStore';
import { FrontendProject } from '../features/projects/store/projectStore';
import { useState } from 'react';

type View = 'login' | 'dashboard' | 'rack';

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [view, setView] = useState<View>('login');
  const [currentProject, setCurrentProject] = useState<FrontendProject | null>(null);

  // On mount, check if the JWT cookie is still valid
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Sync auth state → view
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && view === 'login') setView('dashboard');
      if (!isAuthenticated && view !== 'login') setView('login');
    }
  }, [isAuthenticated, isLoading, view]);

  if (isLoading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-void)', fontFamily: 'var(--font-display)',
        fontSize: 28, letterSpacing: '-0.04em', color: 'var(--text-primary)',
        textShadow: '0 0 30px rgba(155,93,229,0.5)',
      }}>
        ZWING
      </div>
    );
  }

  return (
    <>
      {view === 'login' && (
        <LoginPage onLogin={() => setView('dashboard')} />
      )}

      {view === 'dashboard' && (
        <Dashboard
          onOpenProject={(p: FrontendProject) => {
            setCurrentProject(p);
            setView('rack');
          }}
        />
      )}

      {view === 'rack' && currentProject && (
        <ChannelRackPage
          project={currentProject}
          onBack={() => {
            setCurrentProject(null);
            setView('dashboard');
          }}
        />
      )}
    </>
  );
}