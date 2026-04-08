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
    const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || import.meta.env.VITE_API_BASE_URL;
    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
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

  /** Mute/unmute: send only mutable fields so the backend does not require a lock */
  const toggleMute = (channelId: string, currentlyMuted: boolean, volume: number) =>
    sendCommand(`/app/rack/${projectId}/channel/${channelId}/update`, {
      volume: volume / 100,
      active: currentlyMuted, // flip: if currently muted (active=false) → set active=true
    });

  /** Volume: send only mutable fields so the backend does not require a lock */
  const setVolume = (channelId: string, volume: number, active: boolean) =>
    sendCommand(`/app/rack/${projectId}/channel/${channelId}/update`, {
      volume: volume / 100,
      active,
    });

  const lockChannel = (channelId: string) =>
    sendCommand(`/app/rack/${projectId}/channel/${channelId}/lock`);

  const unlockChannel = (channelId: string) =>
    sendCommand(`/app/rack/${projectId}/channel/${channelId}/unlock`);

  const setBpm = (bpm: number) =>
    sendCommand(`/app/rack/${projectId}/bpm/update`, { bpm });

  const startPlayback = () =>
    sendCommand(`/app/rack/${projectId}/playback/start`);

  const stopPlayback = () =>
    sendCommand(`/app/rack/${projectId}/playback/stop`);

  return {
    toggleStep,
    addChannel,
    removeChannel,
    toggleMute,
    setVolume,
    lockChannel,
    unlockChannel,
    setBpm,
    startPlayback,
    stopPlayback,
  };
}