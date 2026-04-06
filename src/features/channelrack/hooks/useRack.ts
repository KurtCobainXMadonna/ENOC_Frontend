import { useEffect } from 'react';
import { api } from '../../../shared/api/client';
import { useRackStore } from '../store/rackStore';

export function useRack(rackId: string) {
  const setRack = useRackStore(s => s.setRack);

  useEffect(() => {
    api.get(`/api/v1/channel-rack/${rackId}/channels`)
      .then(res => {
        const { rackId, channels, version } = res.data;
        setRack({
          rackId,
          channels: channels.map((ch: any) => ({
            id: ch.id,
            name: ch.name,
            sampleId: ch.sampleId,
            volume: ch.volume,
            isMute: ch.isMute,
            steps: ch.steps,
          })),
          version,
        });
      });
  }, [rackId]);
}