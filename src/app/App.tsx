import { useState } from 'react';
import { LoginPage } from '../features/auth/components/LoginPage';
import { Dashboard } from '../features/projects/components/Dashboard';
import { ChannelRackPage } from '../features/channelrack/components/ChannelRack';

// Full project shape shared across views
export interface ProjectFull {
  id: string;
  name: string;
  isOwner: boolean;
  owner: string;
  lastModified: string;
  collaborators?: any[];
  projectOwner?: any;
}

export default function App() {
  const [view, setView] = useState<'login' | 'dashboard' | 'rack'>('login');
  const [currentProject, setCurrentProject] = useState<ProjectFull | null>(null);

  return (
    <>
      {view === 'login' && <LoginPage onLogin={() => setView('dashboard')} />}
      {view === 'dashboard' && (
        <Dashboard
          onOpenProject={(p: ProjectFull) => { setCurrentProject(p); setView('rack'); }}
        />
      )}
      {view === 'rack' && currentProject && (
        <ChannelRackPage
          project={currentProject}
          onBack={() => setView('dashboard')}
        />
      )}
    </>
  );
}