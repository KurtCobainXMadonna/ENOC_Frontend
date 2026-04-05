export const MOCK_SOUNDS = [
  { id: "s1", name: "Kick 1", category: "KICK", blobUrl: "" },
  { id: "s2", name: "Kick 2", category: "KICK", blobUrl: "" },
  { id: "s3", name: "Hi-Hat 1", category: "HIHAT", blobUrl: "" },
  { id: "s4", name: "Hi-Hat 2", category: "HIHAT", blobUrl: "" },
  { id: "s5", name: "Snare 1", category: "SNARE", blobUrl: "" },
  { id: "s6", name: "Snare 2", category: "SNARE", blobUrl: "" },
  { id: "s7", name: "Clap 1", category: "CLAP", blobUrl: "" },
];

export const MOCK_PROJECTS = [
  { id: "p1", name: "Cum As You Are", owner: "Hbquial", lastModified: "Hace 3 semanas", isOwner: true },
  { id: "p2", name: "Loser", owner: "Elpensacamin", lastModified: "Hace 5 meses", isOwner: false },
];

export const MOCK_ACTIVITY = [
  { user: "Hbquial", avatar: "H", action: "agregó", target: "Kick 1...", color: "#9B5DE5" },
  { user: "xXJuanXx", avatar: "J", action: "editó", target: "Clap 2...", color: "#FF2D6B" },
  { user: "Pitbull", avatar: "P", action: "eliminó", target: "Snare 1...", color: "#00F5D4" },
];

export const MOCK_COLLABORATORS = [
  { id: "u1", initial: "H", color: "#9B5DE5" },
  { id: "u2", initial: "J", color: "#FF2D6B" },
  { id: "u3", initial: "P", color: "#00F5D4" },
];

export const INITIAL_CHANNELS = [
  { id: "c1", name: "Hi-Hat 1", soundId: "s3", volume: 80, isMute: false, steps: Array(16).fill(false).map((_, i) => i % 2 === 0) },
  { id: "c2", name: "Snare 2", soundId: "s6", volume: 90, isMute: false, steps: Array(16).fill(false).map((_, i) => i === 4 || i === 12) },
  { id: "c3", name: "Clap 2", soundId: "s7", volume: 75, isMute: false, steps: Array(16).fill(false).map((_, i) => i % 8 === 4) },
  { id: "c4", name: "Kick 1", soundId: "s1", volume: 100, isMute: false, steps: Array(16).fill(false).map((_, i) => i === 0 || i === 6 || i === 8) },
];