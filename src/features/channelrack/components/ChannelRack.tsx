import { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from '../../../shared/components/Icon';
import { TransportBar } from './TransportBar';
import { SoundLibrary } from './SoundPicker';
import { ChannelRow } from './Channel';
import { MOCK_ACTIVITY } from '../constants';
import { useRackStore } from '../store/rackStore';
import { useRackSocket } from '../hooks/useRackSocket';
import { rackApi } from '../api/rackApi';
import { soundsApi } from '../api/soundsApi';
import { BackendSound } from '../../../shared/api/types';
import { useAuthStore } from '../../auth/store/authStore';
import { FrontendProject } from '../../projects/store/projectStore';

// ── Collaborator derived from project ────────────────────────────────
interface Collaborator { id: string; initial: string; color: string; }

function toCollaborator(member: { id: string; name: string }, colors: string[]): Collaborator {
  return { id: member.id, initial: member.name[0]?.toUpperCase() ?? '?', color: colors[0] ?? '#9B5DE5' };
}

const PALETTE = ['#9B5DE5', '#FF2D6B', '#00F5D4', '#FFB703', '#06D6A0'];

// ── ProjectInfo ──────────────────────────────────────────────────────
function ProjectInfo({ name, bpm, collaborators, currentStep, isPlaying }: { name: string; bpm: number; collaborators: Collaborator[]; currentStep: number; isPlaying: boolean }) {
  const secondsPerStep = 60 / bpm / 4;
  const totalSeconds = currentStep >= 0 ? Math.floor(currentStep * secondsPerStep) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 32, marginBottom: 12 }}>
        {Array.from({ length: 14 }).map((_, i) => {
          const h = 20 + Math.sin(i * 0.8) * 10;
          return <div key={i} style={{ flex: 1, height: `${h}px`, borderRadius: 2, background: 'var(--neon-green)', opacity: 0.8 }} />;
        })}
      </div>
      <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6 }}>{name}</div>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 4 }}>
        BPM: <span style={{ color: 'var(--neon-cyan)' }}>{bpm}</span>
      </div>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 12 }}>
        Tiempo: <span style={{ color: 'var(--text-primary)' }}>{isPlaying ? `${minutes}:${seconds.toString().padStart(2, '0')}` : '0:00'}</span>
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

// ── ActivityFeed ──────────────────────────────────────────────────────
function ActivityFeed() {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--neon-violet)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon.Users /> Actividad
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MOCK_ACTIVITY.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg, ${item.color}, ${item.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
              {item.avatar}
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              <span style={{ color: item.color }}>{item.user}</span> {item.action}{' '}
              <span style={{ color: 'var(--text-primary)' }}>{item.target}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ChannelRackPage ────────────────────────────────────────────────────
export function ChannelRackPage({ project, onBack }: { project: FrontendProject; onBack: () => void }) {
  const { channels, bpm, isLoading, setRack, setMute, setVolume, setBpm } = useRackStore();
  const { user } = useAuthStore();

  const [sounds, setSounds] = useState<BackendSound[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(-1);

  // WebSocket for real-time collaboration
  const { toggleStep, addChannel, removeChannel, updateChannel } = useRackSocket(project.id);

  // ── Load rack + sounds from REST ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [rackRes, soundsRes] = await Promise.all([
          rackApi.getByProject(project.id),
          soundsApi.getAll(),
        ]);
        if (!cancelled) {
          setRack(rackRes.data.data);
          setSounds(soundsRes.data.data);
        }
      } catch (err) {
        console.error('Error loading rack:', err);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [project.id, setRack]);

  // ── Local sequencer ───────────────────────────────────────────────
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

  // ── Handlers ──────────────────────────────────────────────────────
  const handleToggleStep = (channelId: string, stepIdx: number) => {
    // Send via WebSocket — store updates via applyEvent('STEP_TOGGLED')
    toggleStep(channelId, stepIdx);
  };

  const handleMute = (channelId: string, currentMute: boolean) => {
    const newMute = !currentMute;
    setMute(channelId, newMute); // optimistic
    updateChannel(channelId, { active: !newMute });
  };

  const handleVolumeChange = (channelId: string, volume: number) => {
    setVolume(channelId, volume); // optimistic local update
    // Debounced or on-release send to server
    updateChannel(channelId, { volume: volume / 100 });
  };

  const handleAddChannel = () => {
    if (sounds.length === 0) return;
    const defaultSound = sounds[0];
    addChannel(`Channel ${channels.length + 1}`, defaultSound.soundId);
  };

  const handleRemoveChannel = (channelId: string) => {
    removeChannel(channelId);
  };

  // Build collaborators list
  const collaborators: Collaborator[] = [
    { id: project.owner.id, initial: project.owner.name[0]?.toUpperCase() ?? '?', color: PALETTE[0] },
    ...project.collaborators.map((c, i) => toCollaborator(c, [PALETTE[(i + 1) % PALETTE.length]])),
  ].filter((c, idx, arr) => arr.findIndex((x) => x.id === c.id) === idx);

  // Filter out current user's own entry for display
  const otherCollaborators = collaborators.filter((c) =>
    !user?.email || c.initial !== user.email[0]?.toUpperCase(),
  );

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-void)', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        Cargando rack...
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-void)' }}>
      <TransportBar
        isPlaying={isPlaying}
        bpm={bpm}
        onPlay={() => setIsPlaying((p) => !p)}
        onStop={() => { setIsPlaying(false); stopSequencer(); }}
        onBpmChange={(fn) => setBpm(fn(bpm))}
        projectName={project.name}
        collaborators={otherCollaborators}
        onBack={onBack}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <SoundLibrary
          sounds={sounds.map((s) => ({ id: s.soundId, name: s.name, category: s.category, blobUrl: s.blobUrl }))}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16, gap: 12 }}>
          {/* Channel rack panel */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--neon-violet)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon.Music /> Channel Rack
              </span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                <div style={{ marginLeft: 168, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', flex: 1, gap: 3 }}>
                  {[1, 2, 3, 4].map((beat) => (
                    <div key={beat} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: currentStep >= (beat - 1) * 4 && currentStep < beat * 4 ? 'var(--neon-cyan)' : 'var(--text-muted)', fontWeight: currentStep >= (beat - 1) * 4 && currentStep < beat * 4 ? 700 : 400, paddingLeft: 4 }}>
                      {beat}
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 10 }} onClick={handleAddChannel} disabled={sounds.length === 0}>
                <Icon.Plus /> Canal
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px' }}>
              {channels.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  <div style={{ fontSize: 32, opacity: 0.3 }}>♪</div>
                  <div>Arrastra un sonido o añade un canal</div>
                </div>
              )}
              {channels.map((channel, i) => (
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  currentStep={currentStep}
                  isPlaying={isPlaying}
                  index={i}
                  onToggleStep={(stepIdx) => handleToggleStep(channel.id, stepIdx)}
                  onMute={() => handleMute(channel.id, channel.isMute)}
                  onVolumeChange={(v) => handleVolumeChange(channel.id, v)}
                  onRemove={() => handleRemoveChannel(channel.id)}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flexShrink: 0 }}>
            <ActivityFeed />
            <ProjectInfo name={project.name} bpm={bpm} collaborators={collaborators} currentStep={currentStep} isPlaying={isPlaying} />
          </div>
        </div>
      </div>
    </div>
  );
}