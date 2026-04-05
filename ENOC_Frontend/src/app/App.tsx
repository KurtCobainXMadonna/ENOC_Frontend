import { useState } from 'react';
import { LoginPage } from '../features/auth/components/LoginPage';
import { Dashboard } from '../features/projects/components/Dashboard';
import { ChannelRackPage } from '../features/channelrack/components/ChannelRack';

interface Project { id: string; name: string; }

export default function App() {
  const [view, setView] = useState<'login' | 'dashboard' | 'rack'>('login');
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  return (
    <>
      {view === 'login' && <LoginPage onLogin={() => setView('dashboard')} />}
      {view === 'dashboard' && <Dashboard onOpenProject={(p: Project) => { setCurrentProject(p); setView('rack'); }} />}
      {view === 'rack' && currentProject && <ChannelRackPage project={currentProject} onBack={() => setView('dashboard')} />}
    </>
  );
}