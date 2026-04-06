import { useState, useEffect } from 'react';
import { apiClient } from '../../../shared/api/client';

export function useSounds() {
  const [sounds, setSounds] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/api/sounds').then(({ data }) => {
      setSounds(data.data.map((s: any) => ({
        id: s.soundId, name: s.name,
        category: s.category, blobUrl: s.blobUrl,
      })));
    });
  }, []);

  return sounds;
}