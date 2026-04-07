import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface RackEvent {
  type: string;
  payload: any;
  triggeredBy: string;
}

export function useRackSocket(projectId: string, onEvent: (e: RackEvent) => void) {
  const clientRef = useRef<Client | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/rack/${projectId}`, (msg) => {
          onEventRef.current(JSON.parse(msg.body));
        });
        client.subscribe('/user/queue/errors', (msg) => {
          console.error('[WS Error]', msg.body);
        });
        client.subscribe('/user/queue/rack/state', (msg) => {
          onEventRef.current(JSON.parse(msg.body));
        });
        client.publish({ destination: `/app/project/${projectId}/join` });
        client.publish({ destination: `/app/rack/${projectId}/load` });
      },
      onStompError: (frame) => {
        console.error('[STOMP Error]', frame.headers['message'], frame.body);
      },
    });
    clientRef.current = client;
    client.activate();

    return () => {
      if (client.connected) {
        client.publish({ destination: `/app/project/${projectId}/leave` });
      }
      client.deactivate();
      clientRef.current = null;
    };
  }, [projectId]);

  const sendCommand = useCallback((destination: string, body?: object) => {
    const client = clientRef.current;
    if (!client?.connected) {
      console.warn('[WS] Not connected, dropping command to', destination);
      return;
    }
    client.publish({
      destination,
      body: body ? JSON.stringify(body) : undefined,
    });
  }, []);

  const toggleStep = (channelId: string, stepIndex: number) =>
    sendCommand(`/app/rack/${projectId}/channel/${channelId}/step`, { stepIndex });

  const addChannel = (name: string, soundId: string) =>
    sendCommand(`/app/rack/${projectId}/channel/add`, { name, soundId });

  const removeChannel = (channelId: string) =>
    sendCommand(`/app/rack/${projectId}/channel/${channelId}/remove`);

  /** Mute/unmute: uses updateChannel because the backend has no dedicated mute endpoint */
  const toggleMute = (channelId: string, currentlyMuted: boolean, name: string, soundId: string, volume: number) =>
    sendCommand(`/app/rack/${projectId}/channel/${channelId}/update`, {
      name,
      soundId,
      volume: volume / 100,
      active: currentlyMuted, // flip: if currently muted (active=false) → set active=true
    });

  /** Volume: uses updateChannel because the backend has no dedicated volume endpoint */
  const setVolume = (channelId: string, volume: number, name: string, soundId: string, active: boolean) =>
    sendCommand(`/app/rack/${projectId}/channel/${channelId}/update`, {
      name,
      soundId,
      volume: volume / 100,
      active,
    });

  const lockChannel = (channelId: string) =>
    sendCommand(`/app/rack/${projectId}/channel/${channelId}/lock`);

  const unlockChannel = (channelId: string) =>
    sendCommand(`/app/rack/${projectId}/channel/${channelId}/unlock`);

  const setBpm = (bpm: number) =>
    sendCommand(`/app/rack/${projectId}/bpm/update`, { bpm });

  return { toggleStep, addChannel, removeChannel, toggleMute, setVolume, lockChannel, unlockChannel, setBpm };
}