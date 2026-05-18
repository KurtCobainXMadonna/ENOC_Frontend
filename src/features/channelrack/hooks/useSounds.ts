import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../shared/api/client';

export interface Sound {
  id: string;
  name: string;
  category: string;
  blobUrl: string;
  projectId?: string | null; // null/undefined → global preset
  uploadedBy?: string | null;
}

/**
 * Loads sounds visible inside a project (globals + uploads scoped to that project).
 * If projectId is omitted, falls back to globals only — useful for surfaces
 * outside a project room.
 */
export function useSounds(projectId?: string) {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSounds = useCallback(async () => {
    setIsLoading(true);
    const url = projectId ? `/api/sounds/project/${projectId}` : '/api/sounds';
    try {
      const { data } = await apiClient.get(url);
      setSounds(
        (data.data ?? []).map((s: any) => ({
          id: s.soundId,
          name: s.name,
          category: s.category,
          blobUrl: s.blobUrl,
          projectId: s.projectId ?? null,
          uploadedBy: s.uploadedBy ?? null,
        }))
      );
    } catch (err) {
      console.error('[useSounds] Failed to load sounds:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchSounds();
  }, [fetchSounds]);

  return { sounds, isLoading, refetch: fetchSounds };
}