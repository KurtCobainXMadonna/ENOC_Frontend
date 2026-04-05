import { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from '../../../shared/components/Icon';
import { TransportBar } from './TransportBar';
import { SoundLibrary } from './SoundPicker';
import { ChannelRow } from './Channel';
import { MOCK_SOUNDS, MOCK_ACTIVITY, MOCK_COLLABORATORS, INITIAL_CHANNELS } from '../constants';

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

function ProjectInfo({ name, bpm, collaborators }: { name: string; bpm: number; collaborators: Collaborator[] }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 32, marginBottom: 12 }}>
        {Array.from({ length: 24 }).map((_, i) => {
          const h = 20 + Math.sin(i * 0.8) * 10;
          const isGreen = i < 14;
          return <div key={i} style={{ flex: 1, height: `${h}px`, borderRadius: 2, background: isGreen ? 'var(--neon-green)' : 'var(--bg-raised)', opacity: isGreen ? 0.8 : 0.3 }} />;
        })}
      </div>
      <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6 }}>{name}</div>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 12 }}>
        BPM: <span style={{ color: 'var(--neon-cyan)' }}>{bpm}</span>
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

// ── ChannelRackPage ────────────────────────────────────────────────────────────
interface Project { id: string; name: string; }

export function ChannelRackPage({ project, onBack }: { project: Project; onBack: () => void }) {
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(102);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(-1);

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
    if (isPlaying) { startSequencer(); }
    else { stopSequencer(); }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, startSequencer, stopSequencer]);

  const toggleStep = (channelId: string, stepIdx: number) => {
    setChannels(prev => prev.map(ch =>
      ch.id === channelId ? { ...ch, steps: ch.steps.map((s, i) => i === stepIdx ? !s : s) } : ch
    ));
  };

  const toggleMute = (channelId: string) => {
    setChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, isMute: !ch.isMute } : ch));
  };

  const removeChannel = (channelId: string) => {
    setChannels(prev => prev.filter(ch => ch.id !== channelId));
  };

  const addChannel = () => {
    setChannels(prev => [...prev, {
      id: `c${Date.now()}`, name: `Channel ${prev.length + 1}`,
      soundId: 's1', volume: 80, isMute: false, steps: Array(16).fill(false),
    }]);
  };

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
        <SoundLibrary sounds={MOCK_SOUNDS} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16, gap: 12 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--neon-violet)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon.Music /> Channel Rack
              </span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                <div style={{ marginLeft: 168, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', flex: 1, gap: 3 }}>
                  {[1, 2, 3, 4].map(beat => (
                    <div key={beat} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: currentStep >= (beat - 1) * 4 && currentStep < beat * 4 ? 'var(--neon-cyan)' : 'var(--text-muted)', fontWeight: currentStep >= (beat - 1) * 4 && currentStep < beat * 4 ? 700 : 400, paddingLeft: 4 }}>
                      {beat}
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 10 }} onClick={addChannel}>
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
                  key={channel.id} channel={channel} currentStep={currentStep}
                  isPlaying={isPlaying} index={i}
                  onToggleStep={stepIdx => toggleStep(channel.id, stepIdx)}
                  onMute={() => toggleMute(channel.id)}
                  onVolumeChange={v => setChannels(prev => prev.map(ch => ch.id === channel.id ? { ...ch, volume: v } : ch))}
                  onRemove={() => removeChannel(channel.id)}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flexShrink: 0 }}>
            <ActivityFeed activity={MOCK_ACTIVITY} />
            <ProjectInfo name={project.name} bpm={bpm} collaborators={MOCK_COLLABORATORS} />
          </div>
        </div>
      </div>
    </div>
  );
}