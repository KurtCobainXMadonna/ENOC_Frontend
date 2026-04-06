import { useState, useEffect } from 'react';
import { apiClient } from '../../../shared/api/client';

interface Project {
  id: string; name: string; owner: string;
  lastModified: string; isOwner: boolean;
}

export function useProjects() {
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [collaboratingProjects, setCollaboratingProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    setIsLoading(true);
    const { data } = await apiClient.get('/api/projects');
    const raw = data.data;

    setOwnedProjects(raw.ownedProjects.map((p: any) => ({
      id: p.projectId, name: p.projectName,
      owner: p.projectOwner?.name ?? 'Tú',
      lastModified: 'Reciente', isOwner: true,
    })));
    setCollaboratingProjects(raw.collaboratingProjects.map((p: any) => ({
      id: p.projectId, name: p.projectName,
      owner: p.projectOwner?.name ?? '?',
      lastModified: 'Reciente', isOwner: false,
    })));
    setIsLoading(false);
  };

  const createProject = async (name: string) => {
    const { data } = await apiClient.post('/api/projects', { name });
    const p = data.data;
    const newProj = { id: p.projectId, name: p.projectName, owner: 'Tú', lastModified: 'Ahora', isOwner: true };
    setOwnedProjects(prev => [newProj, ...prev]);
    return newProj;
  };

  const deleteProject = async (projectId: string) => {
    await apiClient.delete(`/api/projects/${projectId}`);
    setOwnedProjects(prev => prev.filter(p => p.id !== projectId));
  };

  useEffect(() => { fetchProjects(); }, []);

  return { ownedProjects, collaboratingProjects, isLoading, createProject, deleteProject };
}