import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../shared/api/client';
import { sanitizePathSegment } from '../../../shared/utils/url';

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
  const safeProjectId = sanitizePathSegment(projectId);

  const fetchSounds = useCallback(async () => {
    setIsLoading(true);

    if (projectId && !safeProjectId) {
      console.warn('[useSounds] Ignoring invalid projectId for project-scoped sounds');
      setIsLoading(false);
      return;
    }

    const url = safeProjectId ? `/api/sounds/project/${safeProjectId}` : '/api/sounds';
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
  }, [projectId, safeProjectId]);

  useEffect(() => {
    fetchSounds();
  }, [fetchSounds]);

  return { sounds, isLoading, refetch: fetchSounds };
}