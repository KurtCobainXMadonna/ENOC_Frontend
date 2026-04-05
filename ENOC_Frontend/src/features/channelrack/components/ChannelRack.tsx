import { useRackStore } from '../store/rackStore'
import { useRackSocket } from '../hooks/useRackSocket'
import { useAudioEngine } from '../hooks/useAudioEngine'

export function ChannelRackPage({ project, onBack }) {
  const [channels, setChannels] = useState(INITIAL_CHANNELS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(102);
  const intervalRef = useRef(null);
  const stepRef = useRef(-1);

  // Sequencer engine
  const startSequencer = useCallback(() => {
    const interval = (60 / bpm / 4) * 1000;
    intervalRef.current = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % 16;
      setCurrentStep(stepRef.current);
    }, interval);
  }, [bpm]);

  const stopSequencer = useCallback(() => {
    clearInterval(intervalRef.current);
    stepRef.current = -1;
    setCurrentStep(-1);
  }, []);

  useEffect(() => {
    if (isPlaying) { startSequencer(); }
    else { stopSequencer(); }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, startSequencer, stopSequencer]);

  const toggleStep = (channelId, stepIdx) => {
    setChannels(prev => prev.map(ch =>
      ch.id === channelId
        ? { ...ch, steps: ch.steps.map((s, i) => i === stepIdx ? !s : s) }
        : ch
    ));
  };

  const toggleMute = (channelId) => {
    setChannels(prev => prev.map(ch =>
      ch.id === channelId ? { ...ch, isMute: !ch.isMute } : ch
    ));
  };

  const removeChannel = (channelId) => {
    setChannels(prev => prev.filter(ch => ch.id !== channelId));
  };

  const addChannel = () => {
    const newChannel = {
      id: `c${Date.now()}`,
      name: `Channel ${channels.length + 1}`,
      soundId: "s1", volume: 80, isMute: false,
      steps: Array(16).fill(false),
    };
    setChannels(prev => [...prev, newChannel]);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-void)" }}>
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

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sound Library */}
        <SoundLibrary sounds={MOCK_SOUNDS} />

        {/* Main workspace */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: 16, gap: 12 }}>
          {/* Channel Rack */}
          <div style={{
            background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)", flex: 1, display: "flex", flexDirection: "column",
            overflow: "hidden", minHeight: 0,
          }}>
            {/* Rack header */}
            <div style={{
              padding: "10px 16px", borderBottom: "1px solid var(--border-subtle)",
              display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--neon-violet)", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon.Music /> Channel Rack
              </span>

              {/* Playhead position indicators */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", paddingLeft: 12, gap: 0, position: "relative" }}>
                <div style={{ marginLeft: 168, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", flex: 1, gap: 3 }}>
                  {[1, 2, 3, 4].map(beat => (
                    <div key={beat} style={{
                      display: "flex", alignItems: "center", paddingLeft: 4,
                      fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-mono)",
                      fontWeight: currentStep >= (beat - 1) * 4 && currentStep < beat * 4 ? 700 : 400,
                      color: currentStep >= (beat - 1) * 4 && currentStep < beat * 4 ? "var(--neon-cyan)" : "var(--text-muted)",
                    }}>
                      {beat}
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" style={{ padding: "5px 10px", fontSize: 10 }} onClick={addChannel}>
                <Icon.Plus /> Canal
              </button>
            </div>

            {/* Channels */}
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px" }}>
              {channels.length === 0 && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  height: "100%", flexDirection: "column", gap: 12,
                  color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12,
                }}>
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
                  onToggleStep={(stepIdx) => toggleStep(channel.id, stepIdx)}
                  onMute={() => toggleMute(channel.id)}
                  onVolumeChange={(v) => setChannels(prev => prev.map(ch => ch.id === channel.id ? { ...ch, volume: v } : ch))}
                  onRemove={() => removeChannel(channel.id)}
                />
              ))}
            </div>
          </div>

          {/* Bottom panels */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flexShrink: 0 }}>
            <ActivityFeed activity={MOCK_ACTIVITY} />
            <ProjectInfo name={project.name} bpm={bpm} collaborators={MOCK_COLLABORATORS} />
          </div>
        </div>
      </div>
    </div>
  );
}