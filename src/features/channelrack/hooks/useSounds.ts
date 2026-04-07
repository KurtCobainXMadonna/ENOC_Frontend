import { useState, useEffect } from 'react';
import { apiClient } from '../../../shared/api/client';

export interface Sound {
  id: string;
  name: string;
  category: string;
  blobUrl: string;
}

export function useSounds() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/sounds')
      .then(({ data }) => {
        setSounds(
          data.data.map((s: any) => ({
            id: s.soundId,
            name: s.name,
            category: s.category,
            blobUrl: s.blobUrl,
          }))
        );
      })
      .catch((err) => {
        console.error('[useSounds] Failed to load sounds:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { sounds, isLoading };
}