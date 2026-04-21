import { useEffect } from 'react';
import type { Client } from '@stomp/stompjs';
import { apiClient } from '../../../shared/api/client';
import { usePresenceStore } from '../store/presenceStore';
import type { Presence, PresenceEvent } from '../types/presence';

/**
 * Wires presence into a project room.
 *
 * Takes the already-connected STOMP Client from useRackSocket rather than
 * opening a new one — two parallel STOMP sessions would collide with the
 * backend's SESSION_PREFIX dedup logic and cause double-join/double-leave
 * events that corrupt the presence counter.
 *
 * The hook is a no-op until `client` is provided and connected. useRackSocket
 * exposes the client after onConnect; we guard on that with a ref-style check
 * inside the effect so hydration fires exactly once per project.
 *
 * Flow:
 *   1. As soon as we have a projectId, REST-fetch the current roster so the UI
 *      doesn't flicker empty while the WebSocket is still connecting.
 *   2. When the STOMP client is connected, subscribe to
 *      /topic/project/{projectId}/presence. On every event, replace the store
 *      roster with event.roster (never merge — backend always sends full state).
 *   3. On unmount (or project change), unsubscribe and clear the store.
 */
export function usePresence(projectId: string, client: Client | null, connected: boolean) {
  const setRoster = usePresenceStore((s) => s.setRoster);
  const clear = usePresenceStore((s) => s.clear);

  // Step 1 — REST hydration on projectId change. Runs independently of the WS
  // so the roster appears instantly even on slow WebSocket handshakes.
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    apiClient
      .get(`/api/projects/${projectId}/presence`)
      .then((res) => {
        if (cancelled) return;
        const roster: Presence[] = res.data?.data ?? [];
        setRoster(roster, 'ROSTER_SNAPSHOT', null);
      })
      .catch((err) => {
        console.warn('[Presence] Failed to hydrate roster via REST:', err?.message ?? err);
        // Not fatal — the first WS event will populate it anyway.
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, setRoster]);

  // Step 2 — STOMP subscription, gated on connected flag from useRackSocket.
  useEffect(() => {
    if (!projectId || !client || !connected) return;

    const sub = client.subscribe(`/topic/project/${projectId}/presence`, (msg) => {
      try {
        const event: PresenceEvent = JSON.parse(msg.body);
        setRoster(event.roster ?? [], event.type, event.changedUserId);
      } catch (err) {
        console.error('[Presence] Failed to parse PresenceEvent', err);
      }
    });

    return () => {
      try {
        sub.unsubscribe();
      } catch {
        // Ignore — client may already be disconnecting.
      }
    };
  }, [projectId, client, connected, setRoster]);

  // Step 3 — clear store when the component using this hook unmounts.
  useEffect(() => {
    return () => clear();
  }, [clear]);
}
