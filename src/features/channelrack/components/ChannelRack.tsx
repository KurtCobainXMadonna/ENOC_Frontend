import { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from '../../../shared/components/Icon';
import { TransportBar } from './TransportBar';
import { SoundLibrary } from './SoundPicker';
import { ChannelRow } from './Channel';
import { MOCK_ACTIVITY, MOCK_COLLABORATORS } from '../constants';
import { useRackSocket } from '../hooks/useRackSocket';
import { useSounds } from '../hooks/useSounds';

// ── AddChannelModal ───────────────────────────────────────────────────────────
interface Sound { id: string; name: string; category: string; blobUrl: string; }

function AddChannelModal({
  open, onClose, sounds, onAdd,
}: {
  open: boolean;
  onClose: () => void;
  sounds: Sound[];
  onAdd: (name: string, soundId: string) => void;
}) {
  const [name, setName] = useState('Nuevo canal');
  const [soundId, setSoundId] = useState('');

  useEffect(() => {
    if (open && sounds.length > 0 && !soundId) {
      setSoundId(sounds[0].id);
    }
  }, [open, sounds, soundId]);

  if (!open) return null;

  const handleAdd = () => {
    if (!soundId) return;
    onAdd(name, soundId);
    setName('Nuevo canal');
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(8,10,15,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-xl)', padding: 28, width: 360,
          boxShadow: 'var(--shadow-neon-violet)',
          animation: 'modal-enter 0.2s ease',
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>
          Agregar canal
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Nombre del canal</label>
            <input
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Sonido</label>
            <select
              value={soundId}
              onChange={e => setSoundId(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px',
                background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none',
              }}
            >
              {sounds.map(s => (
                <option key={s.id} value={s.id}>{s.category} — {s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={handleAdd}
              disabled={!soundId}
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ActivityFeed ──────────────────────────────────────────────────────────────
interface Activity { user: string; avatar: string; action: string; target: string; color: string; }

function ActivityFeed({ activity }: { activity: Activity[] }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--neon-violet)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon.Users /> Actividad
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activity.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg, ${item.color}, ${item.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
              {item.avatar}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              <span style={{ color: item.color }}>{item.user}</span> {item.action} <span style={{ color: 'var(--text-primary)' }}>{item.target}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ProjectInfo ───────────────────────────────────────────────────────────────
interface Collaborator { id: string; initial: string; color: string; }

function ProjectInfo({ name, bpm, collaborators, currentStep, isPlaying }: { name: string; bpm: number; collaborators: Collaborator[]; currentStep: number; isPlaying: boolean }) {
  const secondsPerStep = 60 / bpm / 4;
  const totalSeconds = currentStep >= 0 ? Math.floor(currentStep * secondsPerStep) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const duracion = isPlaying && currentStep >= 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : '0:00';

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 32, marginBottom: 12 }}>
        {Array.from({ length: 14 }).map((_, i) => {
          const h = 20 + Math.sin(i * 0.8) * 10;
          return (
            <div key={i} style={{ flex: 1, height: `${h}px`, borderRadius: 2, background: 'var(--neon-green)', opacity: isPlaying ? 0.9 : 0.4, transition: 'opacity 0.3s' }} />
          );
        })}
      </div>
      <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6 }}>{name}</div>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 4 }}>
        BPM: <span style={{ color: 'var(--neon-cyan)' }}>{bpm}</span>
      </div>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 12 }}>
        Tiempo: <span style={{ color: 'var(--text-primary)' }}>{duracion}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {collaborators.map((c, i) => (
          <div key={c.id} style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg, ${c.color}, ${c.color}88)`, border: '2px solid var(--bg-surface)', marginLeft: i > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
            {c.initial}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── WsChannel type ────────────────────────────────────────────────────────────
interface WsChannel {
  id: string;
  name: string;
  soundId: string;
  volume: number;    // 0-100
  isMute: boolean;
  steps: boolean[];
}

// ── helpers ───────────────────────────────────────────────────────────────────
function normalizeSteps(raw: any): boolean[] {
  if (Array.isArray(raw)) return raw.map(Boolean);
  return Array(16).fill(false);
}

// ── ChannelRackPage ────────────────────────────────────────────────────────────
interface Project { id: string; name: string; }

export function ChannelRackPage({ project, onBack }: { project: Project; onBack: () => void }) {
  const { sounds } = useSounds();
  const [wsChannels, setWsChannels] = useState<WsChannel[]>([]);
  const [rackLoaded, setRackLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(120);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(-1);

  // ── event handler from WebSocket ──────────────────────────────────────────
  const handleRackEvent = useCallback((event: any) => {
    const payload = event.payload ?? event; // RACK_STATE wraps in payload.rack sometimes

    switch (event.type) {
      case 'RACK_STATE': {
        // payload can be the rack directly OR { rack: ... }
        const rack = payload.rack ?? payload;
        const channels: WsChannel[] = (rack.channels ?? []).map((ch: any) => ({
          id: ch.channelId,
          name: ch.name,
          soundId: ch.soundId,
          volume: Math.round((ch.volume ?? 1) * 100),
          isMute: ch.active === false,
          steps: normalizeSteps(ch.steps),
        }));
        setWsChannels(channels);
        if (rack.bpm) setBpm(rack.bpm);
        setRackLoaded(true);
        break;
      }

      case 'CHANNEL_ADDED': {
        const ch = payload;
        setWsChannels(prev => [...prev, {
          id: ch.channelId,
          name: ch.name,
          soundId: ch.soundId,
          volume: Math.round((ch.volume ?? 1) * 100),
          isMute: ch.active === false,
          steps: normalizeSteps(ch.steps),
        }]);
        break;
      }

      case 'CHANNEL_REMOVED': {
        const channelId = payload.channelId ?? payload;
        setWsChannels(prev => prev.filter(c => c.id !== channelId));
        break;
      }

      case 'STEP_TOGGLED': {
        const { channelId, stepIndex, newValue } = payload;
        setWsChannels(prev =>
          prev.map(ch =>
            ch.id === channelId
              ? { ...ch, steps: ch.steps.map((s, i) => (i === stepIndex ? newValue : s)) }
              : ch
          )
        );
        break;
      }

      case 'CHANNEL_UPDATED': {
        const ch = payload;
        setWsChannels(prev =>
          prev.map(c =>
            c.id === ch.channelId
              ? {
                  ...c,
                  name: ch.name ?? c.name,
                  soundId: ch.soundId ?? c.soundId,
                  volume: ch.volume != null ? Math.round(ch.volume * 100) : c.volume,
                  isMute: ch.active != null ? !ch.active : c.isMute,
                  steps: ch.steps ? normalizeSteps(ch.steps) : c.steps,
                }
              : c
          )
        );
        break;
      }

      default:
        break;
    }
  }, []);

  const { toggleStep, addChannel, removeChannel, toggleMute, setVolume } =
    useRackSocket(project.id, handleRackEvent);

  // ── sequencer ─────────────────────────────────────────────────────────────
  const startSequencer = useCallback(() => {
    const interval = (60 / bpm / 4) * 1000;
    intervalRef.current = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % 16;
      setCurrentStep(stepRef.current);
    }, interval);
  }, [bpm]);

  const stopSequencer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stepRef.current = -1;
    setCurrentStep(-1);
  }, []);

  useEffect(() => {
    if (isPlaying) startSequencer();
    else stopSequencer();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, startSequencer, stopSequencer]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleToggleMute = (channelId: string) => {
    const ch = wsChannels.find(c => c.id === channelId);
    if (!ch) return;
    // Optimistic update
    setWsChannels(prev => prev.map(c => c.id === channelId ? { ...c, isMute: !c.isMute } : c));
    // Send to backend via updateChannel (the only supported endpoint)
    toggleMute(channelId, ch.isMute, ch.name, ch.soundId, ch.volume);
  };

  const handleVolumeChange = (channelId: string, volume: number) => {
    const ch = wsChannels.find(c => c.id === channelId);
    if (!ch) return;
    // Optimistic update
    setWsChannels(prev => prev.map(c => c.id === channelId ? { ...c, volume } : c));
    setVolume(channelId, volume, ch.name, ch.soundId, !ch.isMute);
  };

  const handleAddChannel = (name: string, soundId: string) => {
    addChannel(name, soundId);
  };

  const handleRemoveChannel = (channelId: string) => {
    removeChannel(channelId);
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-void)' }}>
      <TransportBar
        isPlaying={isPlaying} bpm={bpm}
        onPlay={() => setIsPlaying(p => !p)}
        onStop={() => { setIsPlaying(false); stopSequencer(); }}
        onBpmChange={setBpm}
        projectName={project.name}
        collaborators={MOCK_COLLABORATORS}
        onBack={onBack}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <SoundLibrary sounds={sounds} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16, gap: 12 }}>
          {/* Channel Rack panel */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            {/* Header */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--neon-violet)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon.Music /> Channel Rack
              </span>
              {/* Beat rulers */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                <div style={{ marginLeft: 168, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', flex: 1, gap: 3 }}>
                  {[1, 2, 3, 4].map(beat => (
                    <div key={beat} style={{
                      fontSize: 9, fontFamily: 'var(--font-mono)',
                      color: currentStep >= (beat - 1) * 4 && currentStep < beat * 4 ? 'var(--neon-cyan)' : 'var(--text-muted)',
                      fontWeight: currentStep >= (beat - 1) * 4 && currentStep < beat * 4 ? 700 : 400,
                      paddingLeft: 4,
                    }}>{beat}</div>
                  ))}
                </div>
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: '5px 10px', fontSize: 10 }}
                onClick={() => {
                  if (sounds.length === 0) {
                    alert('Espera a que carguen los sonidos...');
                    return;
                  }
                  setAddModalOpen(true);
                }}
              >
                <Icon.Plus /> Canal
              </button>
            </div>

            {/* Channel list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px' }}>
              {!rackLoaded && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  <div style={{ fontSize: 20, opacity: 0.5, animation: 'glow-pulse 1.2s ease infinite' }}>◈</div>
                  <div>Conectando con el servidor...</div>
                </div>
              )}
              {rackLoaded && wsChannels.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  <div style={{ fontSize: 32, opacity: 0.3 }}>♪</div>
                  <div>Sin canales — agrega uno para empezar</div>
                </div>
              )}
              {rackLoaded && wsChannels.map((channel, i) => (
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  currentStep={currentStep}
                  isPlaying={isPlaying}
                  index={i}
                  onToggleStep={stepIdx => toggleStep(channel.id, stepIdx)}
                  onMute={() => handleToggleMute(channel.id)}
                  onVolumeChange={v => handleVolumeChange(channel.id, v)}
                  onRemove={() => handleRemoveChannel(channel.id)}
                />
              ))}
            </div>
          </div>

          {/* Bottom panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flexShrink: 0 }}>
            <ActivityFeed activity={MOCK_ACTIVITY} />
            <ProjectInfo name={project.name} bpm={bpm} collaborators={MOCK_COLLABORATORS} currentStep={currentStep} isPlaying={isPlaying} />
          </div>
        </div>
      </div>

      {/* Add channel modal */}
      <AddChannelModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        sounds={sounds}
        onAdd={handleAddChannel}
      />
    </div>
  );
}