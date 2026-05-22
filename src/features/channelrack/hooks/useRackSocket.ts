import { useEffect, useRef, useCallback, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { sanitizePathSegment } from '../../../shared/utils/url';

export interface StepToggledPayload {
  channelId: string;
  stepIndex: number;
  newValue: boolean;
}

export interface ChannelLockPayload {
  channelId: string;
  lockedByUserId: string;
  lockedByEmail: string;
}

interface RackEvent {
  type: string;
  payload: unknown;
  triggeredBy: string;
}

export function useRackSocket(projectId: string, onEvent: (e: RackEvent) => void) {
  const clientRef = useRef<Client | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const safeProjectId = sanitizePathSegment(projectId);

  // Exposed so usePresence (and any other sibling hook) can reuse the same
  // STOMP session instead of opening a second WebSocket. Two connections from
  // one tab would create two Spring session IDs and collide with the backend's
  // SESSION_PREFIX dedup logic, corrupting the presence counter.
  const [client, setClient] = useState<Client | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!safeProjectId) {
      console.warn('[useRackSocket] Invalid projectId, skipping STOMP setup');
      return;
    }

    const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || import.meta.env.VITE_API_BASE_URL;
    const c = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
      reconnectDelay: 3000,
      onConnect: () => {
        c.subscribe(`/topic/rack/${safeProjectId}`, (msg) => {
          try {
            onEventRef.current(JSON.parse(msg.body));
          } catch (err) {
            console.error('[WS Parse Error] rack topic', err);
          }
        });
        c.subscribe('/user/queue/errors', (msg) => {
          console.error('[WS Error]', msg.body);
        });
        c.subscribe('/user/queue/rack/state', (msg) => {
          try {
            onEventRef.current(JSON.parse(msg.body));
          } catch (err) {
            console.error('[WS Parse Error] rack state', err);
          }
        });
        c.publish({ destination: `/app/project/${safeProjectId}/join` });
        c.publish({ destination: `/app/rack/${safeProjectId}/load` });
        setConnected(true);
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => {
        console.error('[STOMP Error]', frame.headers['message'], frame.body);
      },
    });
    clientRef.current = c;
    setClient(c);
    c.activate();

    return () => {
      if (c.connected) {
        c.publish({ destination: `/app/project/${safeProjectId}/leave` });
      }
      c.deactivate();
      clientRef.current = null;
      setClient(null);
      setConnected(false);
    };
  }, [safeProjectId]);

  const sendCommand = useCallback((destination: string, body?: object) => {
    const c = clientRef.current;
    if (!c?.connected) {
      console.warn('[WS] Not connected, dropping command to', destination);
      return;
    }
    c.publish({
      destination,
      body: body ? JSON.stringify(body) : undefined,
    });
  }, []);

  const toggleStep = (channelId: string, stepIndex: number) =>
    safeProjectId ? sendCommand(`/app/rack/${safeProjectId}/channel/${channelId}/step`, { stepIndex }) : undefined;

  const addChannel = (name: string, soundId: string) =>
    safeProjectId ? sendCommand(`/app/rack/${safeProjectId}/channel/add`, { name, soundId }) : undefined;

  const removeChannel = (channelId: string) =>
    safeProjectId ? sendCommand(`/app/rack/${safeProjectId}/channel/${channelId}/remove`) : undefined;

  /** Mute/unmute: send only mutable fields so the backend does not require a lock */
  const toggleMute = (channelId: string, currentlyMuted: boolean, volume: number) =>
    safeProjectId ? sendCommand(`/app/rack/${safeProjectId}/channel/${channelId}/update`, {
      volume: volume / 100,
      active: currentlyMuted, // flip: if currently muted (active=false) → set active=true
    }) : undefined;

  /** Volume: send only mutable fields so the backend does not require a lock */
  const setVolume = (channelId: string, volume: number, active: boolean) =>
    safeProjectId ? sendCommand(`/app/rack/${safeProjectId}/channel/${channelId}/update`, {
      volume: volume / 100,
      active,
    }) : undefined;

  const lockChannel = (channelId: string) =>
    safeProjectId ? sendCommand(`/app/rack/${safeProjectId}/channel/${channelId}/lock`) : undefined;

  const unlockChannel = (channelId: string) =>
    safeProjectId ? sendCommand(`/app/rack/${safeProjectId}/channel/${channelId}/unlock`) : undefined;

  const setBpm = (bpm: number) =>
    safeProjectId ? sendCommand(`/app/rack/${safeProjectId}/bpm/update`, { bpm }) : undefined;

  const startPlayback = () =>
    safeProjectId ? sendCommand(`/app/rack/${safeProjectId}/playback/start`) : undefined;

  const stopPlayback = () =>
    safeProjectId ? sendCommand(`/app/rack/${safeProjectId}/playback/stop`) : undefined;

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
    // Exposed for presence (and future sibling hooks) — do NOT use this to send
    // rack commands; use the typed functions above so behavior stays consistent.
    client,
    connected,
  };
}
