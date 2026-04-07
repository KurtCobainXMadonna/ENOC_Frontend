import { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from '../../../shared/components/Icon';
import { TransportBar } from './TransportBar';
import { SoundLibrary } from './SoundPicker';
import { ChannelRow } from './Channel';
import { MOCK_ACTIVITY, MOCK_COLLABORATORS } from '../constants';
import { useRackSocket } from '../hooks/useRackSocket';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { useSounds } from '../hooks/useSounds';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Channel {
  id: string;
  name: string;
  soundId: string;
  volume: number;
  isMute: boolean;
  steps: boolean[];
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
  const currentBeat = currentStep >= 0 ? Math.floor(currentStep / 4) + 1 : 1;
  const duracion = isPlaying && currentStep >= 0
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : '0:00';

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 32, marginBottom: 12 }}>
        {Array.from({ length: 14 }).map((_, i) => {
          const h = 20 + Math.sin(i * 0.8) * 10;
          return (
            <div key={i} style={{
              flex: 1, height: `${h}px`, borderRadius: 2,
              background: 'var(--neon-green)', opacity: 0.8,
              animation: `glow-pulse ${1 + i * 0.1}s ease infinite`,
            }} />
          );
        })}
      </div>
      <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6 }}>{name}</div>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 4 }}>
        BPM: <span style={{ color: 'var(--neon-cyan)' }}>{bpm}</span>
      </div>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 4 }}>
        Beat: <span style={{ color: 'var(--text-primary)' }}>{currentBeat}/4</span>
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

// ── LoadingSkeleton ───────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 16px' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{
          height: 40, borderRadius: 'var(--radius-sm)',
          background: 'linear-gradient(90deg, var(--bg-raised) 25%, var(--bg-hover) 50%, var(--bg-raised) 75%)',
          backgroundSize: '200% 100%',
          animation: `shimmer 1.5s infinite ${i * 0.2}s`,
          opacity: 0.6,
        }} />
      ))}
      <div style={{ textAlign: 'center', paddingTop: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        Cargando rack...
      </div>
    </div>
  );
}

// ── ChannelRackPage ────────────────────────────────────────────────────────────
interface Project { id: string; name: string; }

export function ChannelRackPage({ project, onBack }: { project: Project; onBack: () => void }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [rackLoaded, setRackLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(120);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(-1);
  const channelsRef = useRef<Channel[]>([]);

  // Keep channelsRef in sync for use inside the sequencer interval
  channelsRef.current = channels;

  const sounds = useSounds();
  const { loadSample, startSequencer: startAudio, stopSequencer: stopAudio } = useAudioEngine(bpm);

  // Load audio samples when sounds are available
  useEffect(() => {
    sounds.forEach(sound => {
      if (sound.blobUrl) {
        loadSample(sound.id, sound.blobUrl).catch(() => {
          // Silently ignore missing audio files
        });
      }
    });
  }, [sounds, loadSample]);

  const updateChannel = useCallback((channelId: string, updater: (ch: Channel) => Channel) => {
    setChannels(prev => prev.map(ch => ch.id === channelId ? updater(ch) : ch));
  }, []);

  const handleRackEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'RACK_STATE': {
        const loaded: Channel[] = (event.payload.channels ?? []).map((ch: any) => ({
          id: ch.channelId,
          name: ch.name,
          soundId: ch.soundId,
          volume: Math.round((ch.volume ?? 1) * 100),
          isMute: ch.active === false ? true : Boolean(ch.isMute ?? false),
          steps: Array.from({ length: 16 }, (_, i) =>
            Array.isArray(ch.steps) ? Boolean(ch.steps[i]) : false
          ),
        }));
        setChannels(loaded);
        setRackLoaded(true);
        break;
      }

      case 'CHANNEL_ADDED':
        setChannels(prev => [...prev, {
          id: event.payload.channelId,
          name: event.payload.name,
          soundId: event.payload.soundId ?? '',
          volume: 80,
          isMute: false,
          steps: Array(16).fill(false),
        }]);
        break;

      case 'CHANNEL_REMOVED':
        setChannels(prev => prev.filter(ch => ch.id !== event.payload.channelId));
        break;

      case 'STEP_TOGGLED': {
        const { channelId, stepIndex, newValue } = event.payload;
        updateChannel(channelId, ch => ({
          ...ch,
          steps: ch.steps.map((s, i) => i === stepIndex ? Boolean(newValue) : s),
        }));
        break;
      }

      case 'CHANNEL_MUTED':
      case 'MUTE_TOGGLED':
      case 'ChannelMuted':
      case 'CHANNEL_UPDATED':
      case 'ChannelUpdated': {
        const channelId = event.payload.channelId ?? event.payload.id;
        if (!channelId) break;
        updateChannel(channelId, ch => {
          const muteValue = event.payload.mute ?? event.payload.isMute;
          const activeValue = event.payload.active;
          const isMute = typeof muteValue === 'boolean'
            ? muteValue
            : typeof activeValue === 'boolean'
              ? !activeValue
              : !ch.isMute; // toggle if no explicit value
          return { ...ch, isMute };
        });
        break;
      }

      case 'CHANNEL_VOLUME_CHANGED':
      case 'VOLUME_CHANGED':
      case 'ChannelVolumeChanged': {
        const channelId = event.payload.channelId ?? event.payload.id;
        if (!channelId || typeof event.payload.volume !== 'number') break;
        const volume = event.payload.volume <= 1
          ? Math.round(event.payload.volume * 100)
          : Math.round(event.payload.volume);
        updateChannel(channelId, ch => ({ ...ch, volume }));
        break;
      }

      default:
        break;
    }
  }, [updateChannel]);

  const { toggleStep, addChannel, removeChannel, toggleMute, setVolume } = useRackSocket(project.id, handleRackEvent);

  // ── Sequencer ──────────────────────────────────────────────────────────────
  const stopSequencer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stopAudio();
    stepRef.current = -1;
    setCurrentStep(-1);
  }, [stopAudio]);

  const startSequencer = useCallback(() => {
    const interval = (60 / bpm / 4) * 1000;
    // Also start Tone.js audio sequencer
    startAudio(channelsRef.current.map(ch => ({
      id: ch.soundId,
      steps: ch.steps.map((s) => s && !ch.isMute ? true : false),
    })));

    intervalRef.current = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % 16;
      setCurrentStep(stepRef.current);
    }, interval);
  }, [bpm, startAudio]);

  useEffect(() => {
    if (isPlaying) {
      startSequencer();
    } else {
      stopSequencer();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, startSequencer, stopSequencer]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleMute = (channelId: string) => {
    toggleMute(channelId);
  };

  const handleVolumeChange = (channelId: string, volume: number) => {
    setVolume(channelId, volume);
  };

  const handleToggleStep = (channelId: string, stepIdx: number) => {
    toggleStep(channelId, stepIdx);
  };

  const handleAddChannel = () => {
    const name = `Canal ${channels.length + 1}`;
    const defaultSoundId = sounds[0]?.id ?? 's1';
    addChannel(name, defaultSoundId);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-void)' }}>
      <TransportBar
        isPlaying={isPlaying}
        bpm={bpm}
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
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

            {/* Header */}
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--neon-violet)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon.Music /> Channel Rack
              </span>
              {/* Beat markers */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                <div style={{ marginLeft: 168, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', flex: 1, gap: 3 }}>
                  {[1, 2, 3, 4].map(beat => {
                    const beatActive = isPlaying && currentStep >= (beat - 1) * 4 && currentStep < beat * 4;
                    return (
                      <div key={beat} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: beatActive ? 'var(--neon-cyan)' : 'var(--text-muted)', fontWeight: beatActive ? 700 : 400, paddingLeft: 4 }}>
                        {beat}
                      </div>
                    );
                  })}
                </div>
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: '5px 10px', fontSize: 10 }}
                onClick={handleAddChannel}
                disabled={!rackLoaded}
              >
                <Icon.Plus /> Canal
              </button>
            </div>

            {/* Channel list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px' }}>
              {!rackLoaded && <LoadingSkeleton />}

              {rackLoaded && channels.length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  <div style={{ fontSize: 32, opacity: 0.3 }}>♪</div>
                  <div>Arrastra un sonido o añade un canal</div>
                </div>
              )}

              {rackLoaded && channels.map((channel, i) => (
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  currentStep={currentStep}
                  isPlaying={isPlaying}
                  index={i}
                  onToggleStep={stepIdx => handleToggleStep(channel.id, stepIdx)}
                  onMute={() => handleToggleMute(channel.id)}
                  onVolumeChange={v => handleVolumeChange(channel.id, v)}
                  onRemove={() => removeChannel(channel.id)}
                />
              ))}
            </div>
          </div>

          {/* Bottom panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flexShrink: 0 }}>
            <ActivityFeed activity={MOCK_ACTIVITY} />
            <ProjectInfo
              name={project.name}
              bpm={bpm}
              collaborators={MOCK_COLLABORATORS}
              currentStep={currentStep}
              isPlaying={isPlaying}
            />
          </div>
        </div>
      </div>
    </div>
  );
}