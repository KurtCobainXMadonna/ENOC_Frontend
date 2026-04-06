import { create } from "zustand";

interface Channel {
  id: string;
  name: string;
  sampleId: string;
  volume: number;
  isMute: boolean;
  steps: boolean[];
}

interface RackState {
  rackId: string | null;
  channels: Channel[];
  version: number;
  setRack: (rack: { rackId: string; channels: Channel[]; version: number }) => void;
  applyAction: (action: string, data: Record<string, unknown>) => void;
}

export const useRackStore = create<RackState>((set) => ({
  rackId: null,
  channels: [],
  version: 0,

  setRack: (rack) => set(rack),

  applyAction: (action, data) => {
    set((state) => {
      const channelId = data.channelId as string | undefined;
      const stepIndex = typeof data.stepIndex === 'number' ? data.stepIndex : Number(data.stepIndex);
      const volume = typeof data.volume === 'number' ? data.volume : Number(data.volume);
      const mute = typeof data.mute === 'boolean'
        ? data.mute
        : typeof data.isMute === 'boolean'
          ? data.isMute
          : undefined;
      const nextVersion = typeof data.version === 'number' ? data.version : state.version + 1;

      switch (action) {
        case "addChannel":
        case "ChannelAdded":
          return {
            channels: [...state.channels, {
              id: data.channelId as string,
              name: data.name as string,
              sampleId: data.sampleId as string,
              volume: Number.isFinite(volume) ? volume : 100,
              isMute: typeof mute === 'boolean' ? mute : false,
              steps: Array(16).fill(false),
            }],
            version: nextVersion,
          };

        case "removeChannel":
        case "ChannelRemoved":
          return {
            channels: state.channels.filter(c => c.id !== channelId),
            version: nextVersion,
          };

        case "activateStep":
        case "StepActivated":
          if (!channelId || !Number.isInteger(stepIndex)) {
            return state;
          }

          return {
            channels: state.channels.map(c =>
              c.id === channelId
                ? { ...c, steps: c.steps.map((s, i) => i === stepIndex ? true : s) }
                : c
            ),
            version: nextVersion,
          };

        case "deactivateStep":
        case "StepDeactivated":
          if (!channelId || !Number.isInteger(stepIndex)) {
            return state;
          }

          return {
            channels: state.channels.map(c =>
              c.id === channelId
                ? { ...c, steps: c.steps.map((s, i) => i === stepIndex ? false : s) }
                : c
            ),
            version: nextVersion,
          };

        case "toggleMute":
        case "setChannelMute":
        case "ChannelMuteToggled":
          if (!channelId) {
            return state;
          }

          return {
            channels: state.channels.map(c => {
              if (c.id !== channelId) {
                return c;
              }

              if (typeof mute === 'boolean') {
                return { ...c, isMute: mute };
              }

              return { ...c, isMute: !c.isMute };
            }),
            version: nextVersion,
          };

        case "setChannelVolume":
        case "ChannelVolumeChanged":
          if (!channelId || !Number.isFinite(volume)) {
            return state;
          }

          return {
            channels: state.channels.map(c =>
              c.id === channelId ? { ...c, volume } : c
            ),
            version: nextVersion,
          };

        default:
          return state;
      }
    });
  },
}));