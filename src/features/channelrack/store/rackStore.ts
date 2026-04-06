import { create } from 'zustand';
import { BackendChannel, BackendRack, RackEvent } from '../../../shared/api/types';

// ── Frontend Channel type ─────────────────────────────────────────────
export interface Channel {
  id: string;
  rackId: string;
  name: string;
  soundId: string;
  isMute: boolean;   // maps to !active
  volume: number;    // 0-100 (backend is 0-1)
  steps: boolean[];
  position: number;
  lockedBy?: string; // userId holding the lock
}

function mapBackendChannel(c: BackendChannel): Channel {
  return {
    id: c.channelId,
    rackId: c.rackId,
    name: c.name,
    soundId: c.soundId,
    isMute: !c.active,
    volume: Math.round(c.volume * 100),
    steps: Array.isArray(c.steps) ? c.steps : Array(16).fill(false),
    position: c.position,
  };
}

// ── Store ─────────────────────────────────────────────────────────────
interface RackState {
  rackId: string | null;
  projectId: string | null;
  bpm: number;
  channels: Channel[];
  isLoading: boolean;

  // Load from backend REST response
  setRack: (rack: BackendRack) => void;

  // Apply incoming WebSocket events
  applyEvent: (event: RackEvent) => void;

  // Local-only mutations (optimistic UI)
  setMute: (channelId: string, isMute: boolean) => void;
  setVolume: (channelId: string, volume: number) => void;
  setBpm: (bpm: number) => void;
}

export const useRackStore = create<RackState>((set) => ({
  rackId: null,
  projectId: null,
  bpm: 120,
  channels: [],
  isLoading: false,

  setRack: (rack: BackendRack) => {
    set({
      rackId: rack.rackId,
      projectId: rack.projectId,
      bpm: rack.bpm,
      channels: [...rack.channels]
        .sort((a, b) => a.position - b.position)
        .map(mapBackendChannel),
      isLoading: false,
    });
  },

  applyEvent: (event: RackEvent) => {
    set((state) => {
      switch (event.type) {
        case 'CHANNEL_ADDED': {
          const c = event.payload as BackendChannel;
          // Avoid duplicates
          if (state.channels.some((ch) => ch.id === c.channelId)) return state;
          return { channels: [...state.channels, mapBackendChannel(c)] };
        }

        case 'CHANNEL_REMOVED': {
          const { channelId } = event.payload as { channelId: string };
          return { channels: state.channels.filter((c) => c.id !== channelId) };
        }

        case 'STEP_TOGGLED': {
          const { channelId, stepIndex, newValue } = event.payload as { channelId: string; stepIndex: number; newValue: boolean };
          return {
            channels: state.channels.map((c) =>
              c.id === channelId
                ? { ...c, steps: c.steps.map((s, i) => (i === stepIndex ? newValue : s)) }
                : c,
            ),
          };
        }

        case 'CHANNEL_UPDATED': {
          const updated = event.payload as BackendChannel;
          return {
            channels: state.channels.map((c) =>
              c.id === updated.channelId ? mapBackendChannel(updated) : c,
            ),
          };
        }

        case 'CHANNEL_LOCKED': {
          const { channelId, lockedByUserId } = event.payload as { channelId: string; lockedByUserId: string };
          return {
            channels: state.channels.map((c) =>
              c.id === channelId ? { ...c, lockedBy: lockedByUserId } : c,
            ),
          };
        }

        case 'CHANNEL_UNLOCKED': {
          const { channelId } = event.payload as { channelId: string };
          return {
            channels: state.channels.map((c) =>
              c.id === channelId ? { ...c, lockedBy: undefined } : c,
            ),
          };
        }

        default:
          return state;
      }
    });
  },

  // Optimistic local mutations (keep UI snappy while server confirms)
  setMute: (channelId, isMute) => {
    set((s) => ({
      channels: s.channels.map((c) => (c.id === channelId ? { ...c, isMute } : c)),
    }));
  },

  setVolume: (channelId, volume) => {
    set((s) => ({
      channels: s.channels.map((c) => (c.id === channelId ? { ...c, volume } : c)),
    }));
  },

  setBpm: (bpm) => set({ bpm }),
}));