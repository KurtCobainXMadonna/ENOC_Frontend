import { useEffect, useRef, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useRackStore } from '../store/rackStore';
import { RackEvent } from '../../../shared/api/types';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:8080/ws';

export function useRackSocket(projectId: string) {
  const clientRef = useRef<Client | null>(null);
  const { applyEvent } = useRackStore();

  // Generic command sender
  const publish = useCallback((destination: string, body: object = {}) => {
    if (!clientRef.current?.connected) {
      console.warn('STOMP not connected, dropping:', destination);
      return;
    }
    clientRef.current.publish({ destination, body: JSON.stringify(body) });
  }, []);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,

      onConnect: () => {
        console.log('[STOMP] Connected');

        // Join project presence room
        client.publish({ destination: `/app/project/${projectId}/join`, body: '{}' });

        // Subscribe to broadcast rack events
        client.subscribe(`/topic/rack/${projectId}`, (msg: IMessage) => {
          const event: RackEvent = JSON.parse(msg.body);
          applyEvent(event);
        });

        // Subscribe to personal error queue
        client.subscribe('/user/queue/errors', (msg: IMessage) => {
          console.error('[Rack WS error]', msg.body);
        });
      },

      onDisconnect: () => console.log('[STOMP] Disconnected'),
      onStompError: (frame) => console.error('[STOMP error]', frame),
    });

    clientRef.current = client;
    client.activate();

    return () => {
      // Notify server before disconnecting
      if (client.connected) {
        client.publish({ destination: `/app/project/${projectId}/leave`, body: '{}' });
      }
      client.deactivate();
    };
  }, [projectId, applyEvent]);

  // ── Public commands ──────────────────────────────────────────────────

  const toggleStep = useCallback(
    (channelId: string, stepIndex: number) => {
      publish(`/app/rack/${projectId}/channel/${channelId}/step`, { stepIndex });
    },
    [projectId, publish],
  );

  const addChannel = useCallback(
    (name: string, soundId: string) => {
      publish(`/app/rack/${projectId}/channel/add`, { name, soundId });
    },
    [projectId, publish],
  );

  const removeChannel = useCallback(
    (channelId: string) => {
      publish(`/app/rack/${projectId}/channel/${channelId}/remove`, {});
    },
    [projectId, publish],
  );

  const updateChannel = useCallback(
    (channelId: string, payload: { name?: string; soundId?: string; volume?: number; active?: boolean }) => {
      publish(`/app/rack/${projectId}/channel/${channelId}/update`, payload);
    },
    [projectId, publish],
  );

  const lockChannel = useCallback(
    (channelId: string) => publish(`/app/rack/${projectId}/channel/${channelId}/lock`, {}),
    [projectId, publish],
  );

  const unlockChannel = useCallback(
    (channelId: string) => publish(`/app/rack/${projectId}/channel/${channelId}/unlock`, {}),
    [projectId, publish],
  );

  const startPlayback = useCallback(
    () => publish(`/app/rack/${projectId}/playback/start`, {}),
    [projectId, publish],
  );

  const stopPlayback = useCallback(
    () => publish(`/app/rack/${projectId}/playback/stop`, {}),
    [projectId, publish],
  );

  return {
    toggleStep,
    addChannel,
    removeChannel,
    updateChannel,
    lockChannel,
    unlockChannel,
    startPlayback,
    stopPlayback,
  };
}