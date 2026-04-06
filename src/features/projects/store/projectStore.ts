import { create } from 'zustand';
import { projectsApi } from '../api/projectsApi';
import { BackendProject } from '../../../shared/api/types';
import { useAuthStore } from '../../auth/store/authStore';

export interface FrontendProject {
  id: string;
  name: string;
  owner: { id: string; name: string; email: string };
  collaborators: { id: string; name: string; email: string }[];
  channelRackId: string;
  isOwner: boolean;
  lastModified: string;
}

function mapProject(p: BackendProject, currentEmail?: string): FrontendProject {
  return {
    id: p.projectId,
    name: p.projectName,
    owner: { id: p.projectOwner.userId, name: p.projectOwner.name, email: p.projectOwner.email },
    collaborators: p.collaborators.map((c) => ({ id: c.userId, name: c.name, email: c.email })),
    channelRackId: p.channelRackId,
    isOwner: p.projectOwner.email === currentEmail,
    lastModified: 'Reciente',
  };
}

interface ProjectState {
  ownedProjects: FrontendProject[];
  collaboratingProjects: FrontendProject[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (name: string) => Promise<FrontendProject>;
  deleteProject: (id: string) => Promise<void>;
  acceptInvite: (token: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  ownedProjects: [],
  collaboratingProjects: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await projectsApi.getAll();
      const email = useAuthStore.getState().user?.email;
      set({
        ownedProjects: data.data.ownedProjects.map((p) => mapProject(p, email)),
        collaboratingProjects: data.data.collaboratingProjects.map((p) => mapProject(p, email)),
        isLoading: false,
      });
    } catch (err) {
      set({ error: 'Error al cargar proyectos', isLoading: false });
      console.error(err);
    }
  },

  createProject: async (name: string) => {
    const { data } = await projectsApi.create(name);
    const email = useAuthStore.getState().user?.email;
    const project = mapProject(data.data, email);
    set((s) => ({ ownedProjects: [project, ...s.ownedProjects] }));
    return project;
  },

  deleteProject: async (id: string) => {
    await projectsApi.delete(id);
    set((s) => ({
      ownedProjects: s.ownedProjects.filter((p) => p.id !== id),
      collaboratingProjects: s.collaboratingProjects.filter((p) => p.id !== id),
    }));
  },

  acceptInvite: async (token: string) => {
    await projectsApi.acceptInvite(token);
  },
}));