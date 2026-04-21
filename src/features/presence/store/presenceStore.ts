import { create } from 'zustand';
import type { Presence } from '../types/presence';

/**
 * Presence state for the currently-opened project room.
 *
 * Scoped to a single project: when the user navigates away, clear() is called
 * to reset state so the next project doesn't inherit stale roster data.
 *
 * The roster is a Record<userId, Presence> — O(1) color lookup by userId, which
 * is what the activity feed and channel lock UI need on every render.
 */
interface PresenceState {
  roster: Record<string, Presence>;
  lastChangedUserId: string | null;
  lastEventType: 'JOINED' | 'LEFT' | 'ROSTER_SNAPSHOT' | null;

  setRoster: (roster: Presence[], type: PresenceState['lastEventType'], changedUserId: string | null) => void;
  clear: () => void;

  /** Color assigned by the backend to this user in this project. */
  colorFor: (userId: string | undefined | null) => string | undefined;
  /** Display name (or email) assigned by the backend for this user. */
  nameFor: (userId: string | undefined | null) => string | undefined;
  /** Presence list as an array (for avatar strips). */
  asList: () => Presence[];
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  roster: {},
  lastChangedUserId: null,
  lastEventType: null,

  setRoster: (roster, type, changedUserId) => {
    const map: Record<string, Presence> = {};
    for (const p of roster) map[p.userId] = p;
    set({ roster: map, lastEventType: type, lastChangedUserId: changedUserId });
  },

  clear: () => set({ roster: {}, lastChangedUserId: null, lastEventType: null }),

  colorFor: (userId) => {
    if (!userId) return undefined;
    return get().roster[userId]?.color;
  },

  nameFor: (userId) => {
    if (!userId) return undefined;
    const p = get().roster[userId];
    return p?.displayName ?? p?.email;
  },

  asList: () => Object.values(get().roster),
}));
