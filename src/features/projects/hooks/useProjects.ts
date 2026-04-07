import { useState, useEffect } from 'react';
import { apiClient } from '../../../shared/api/client';

interface Project {
  id: string;
  name: string;
  owner: string;
  lastModified: string;
  isOwner: boolean;
}

function toRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Reciente';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function mapProject(p: any, isOwner: boolean): Project {
  // Support multiple possible field names from the backend
  return {
    id: p.projectId ?? p.id ?? '',
    name: p.projectName ?? p.name ?? 'Sin nombre',
    owner: p.projectOwner?.name ?? p.ownerName ?? p.owner ?? (isOwner ? 'Tú' : '?'),
    lastModified: toRelativeTime(p.updatedAt ?? p.lastModified ?? p.createdAt),
    isOwner,
  };
}

export function useProjects() {
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [collaboratingProjects, setCollaboratingProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/projects');
      // Support both { data: { ownedProjects, collaboratingProjects } } and flat arrays
      const payload = data.data ?? data;

      if (Array.isArray(payload)) {
        // Backend returned a flat list — infer ownership from a flag
        const owned = payload.filter((p: any) => p.isOwner !== false && p.owner !== false);
        const collab = payload.filter((p: any) => p.isOwner === false || p.owner === false);
        setOwnedProjects(owned.map((p: any) => mapProject(p, true)));
        setCollaboratingProjects(collab.map((p: any) => mapProject(p, false)));
      } else {
        setOwnedProjects((payload.ownedProjects ?? []).map((p: any) => mapProject(p, true)));
        setCollaboratingProjects((payload.collaboratingProjects ?? []).map((p: any) => mapProject(p, false)));
      }
    } catch (err: any) {
      console.error('[useProjects] fetchProjects failed:', err);
      setError(err?.response?.data?.message ?? 'Error al cargar proyectos');
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (name: string): Promise<Project> => {
    const { data } = await apiClient.post('/api/projects', { name });
    const p = data.data ?? data;
    const newProj = mapProject(p, true);
    setOwnedProjects(prev => [newProj, ...prev]);
    return newProj;
  };

  const deleteProject = async (projectId: string) => {
    await apiClient.delete(`/api/projects/${projectId}`);
    setOwnedProjects(prev => prev.filter(p => p.id !== projectId));
  };

  useEffect(() => { fetchProjects(); }, []);

  return { ownedProjects, collaboratingProjects, isLoading, error, createProject, deleteProject };
}