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
      switch (action) {
        case "addChannel":
          return {
            channels: [...state.channels, {
              id: data.channelId as string,
              name: data.name as string,
              sampleId: data.sampleId as string,
              volume: 100,
              isMute: false,
              steps: Array(16).fill(false),
            }],
          };

        case "removeChannel":
          return {
            channels: state.channels.filter(c => c.id !== data.channelId),
          };

        case "activateStep":
          return {
            channels: state.channels.map(c =>
              c.id === data.channelId
                ? { ...c, steps: c.steps.map((s, i) => i === data.stepIndex ? true : s) }
                : c
            ),
          };

        case "deactivateStep":
          return {
            channels: state.channels.map(c =>
              c.id === data.channelId
                ? { ...c, steps: c.steps.map((s, i) => i === data.stepIndex ? false : s) }
                : c
            ),
          };

        default:
          return state;
      }
    });
  },
}));