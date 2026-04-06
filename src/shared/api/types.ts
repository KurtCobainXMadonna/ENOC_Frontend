// All backend responses are wrapped in GeneralResponse<T>
export interface BackendResponse<T> {
  status: string;
  message: string;
  data: T;
}

// ── Auth ─────────────────────────────────────────────────────────────
export interface BackendUser {
  name: string;
  email: string;
}

// ── Projects ──────────────────────────────────────────────────────────
export interface BackendProjectMember {
  userId: string;
  name: string;
  email: string;
}

export interface BackendProject {
  projectId: string;
  projectName: string;
  projectOwner: BackendProjectMember;
  collaborators: BackendProjectMember[];
  channelRackId: string;
}

// ── Sounds ────────────────────────────────────────────────────────────
export type SoundCategory = 'KICK' | 'SNARE' | 'HIHAT' | 'CLAP' | 'SYNTH' | 'SAMPLE';

export interface BackendSound {
  soundId: string;
  name: string;
  category: SoundCategory;
  blobUrl: string;
  description: string;
}

// ── Rack ──────────────────────────────────────────────────────────────
export interface BackendChannel {
  channelId: string;
  rackId: string;
  name: string;
  soundId: string;
  active: boolean;
  volume: number;
  steps: boolean[];
  position: number;
}

export interface BackendRack {
  rackId: string;
  projectId: string;
  bpm: number;
  channels: BackendChannel[];
}

// ── WebSocket events ──────────────────────────────────────────────────
export type RackEventType =
  | 'RACK_STATE'
  | 'CHANNEL_ADDED'
  | 'CHANNEL_REMOVED'
  | 'CHANNEL_UPDATED'
  | 'STEP_TOGGLED'
  | 'CHANNEL_LOCKED'
  | 'CHANNEL_UNLOCKED'
  | 'PLAYBACK_STARTED'
  | 'PLAYBACK_STOPPED'
  | 'USER_DISCONNECTED'
  | 'ERROR';

export interface RackEvent {
  type: RackEventType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  triggeredBy: string;
}

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