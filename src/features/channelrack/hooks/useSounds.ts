import { useState, useEffect } from 'react';
import { apiClient } from '../../../shared/api/client';

export interface Sound {
  id: string;
  name: string;
  category: string;
  blobUrl: string;
}

export function useSounds(): Sound[] {
  const [sounds, setSounds] = useState<Sound[]>([]);

  useEffect(() => {
    apiClient.get('/api/sounds')
      .then(({ data }) => {
        const list: any[] = data.data ?? data ?? [];
        setSounds(list.map((s: any) => ({
          id: s.soundId ?? s.id ?? '',
          name: s.name ?? s.soundName ?? 'Sonido',
          category: (s.category ?? s.type ?? 'OTROS').toUpperCase(),
          blobUrl: s.blobUrl ?? s.url ?? s.fileUrl ?? '',
        })));
      })
      .catch(err => {
        console.warn('[useSounds] Could not load sounds from API:', err?.response?.status);
        // Leave sounds as empty array — UI handles the empty state
      });
  }, []);

  return sounds;
}