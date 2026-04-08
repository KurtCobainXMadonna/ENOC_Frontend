import { useState, useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import { Icon } from '../../../shared/components/Icon';
import { TransportBar } from './TransportBar';
import { SoundLibrary } from './SoundPicker';
import { ChannelRow } from './Channel';
import { useRackSocket } from '../hooks/useRackSocket';
import { useSounds } from '../hooks/useSounds';
import { apiClient } from '../../../shared/api/client';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Sound { id: string; name: string; category: string; blobUrl: string; }

interface WsChannel {
  id: string; name: string; soundId: string;
  volume: number; isMute: boolean; steps: boolean[];
}

interface Collaborator { id: string; initial: string; color: string; name: string; }
interface Activity { user: string; avatar: string; action: string; target: string; color: string; }

const AVATAR_COLORS = ['#9B5DE5', '#FF2D6B', '#00F5D4', '#FFB703', '#06D6A0', '#1B4FE8'];
const colorForIndex = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length];

function normalizeSteps(raw: any): boolean[] {
  if (Array.isArray(raw)) return raw.map(Boolean);
  return Array(16).fill(false);
}

// ── AddChannelModal ───────────────────────────────────────────────────────────
function AddChannelModal({ open, onClose, sounds, onAdd }: {
  open: boolean; onClose: () => void; sounds: Sound[];
  onAdd: (name: string, soundId: string) => void;
}) {
  const [name, setName] = useState('Nuevo canal');
  const [soundId, setSoundId] = useState('');

  useEffect(() => {
    if (open && sounds.length > 0 && !soundId) setSoundId(sounds[0].id);
  }, [open, sounds, soundId]);

  if (!open) return null;
  const handleAdd = () => { if (!soundId) return; onAdd(name, soundId); setName('Nuevo canal'); onClose(); };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(8,10,15,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-xl)', padding: 28, width: 360, boxShadow: 'var(--shadow-neon-violet)', animation: 'modal-enter 0.2s ease' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>Agregar canal</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="label">Nombre del canal</label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
          <div>
            <label className="label">Sonido</label>
            <select value={soundId} onChange={e => setSoundId(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' }}>
              {sounds.map(s => <option key={s.id} value={s.id}>{s.category} — {s.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleAdd} disabled={!soundId}>Agregar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── InviteModal ───────────────────────────────────────────────────────────────
function InviteModal({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string; }) {
  const [email, setEmail] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setStatus('loading'); setErrorMsg('');
    try {
      const { data } = await apiClient.post('/api/invites', { projectId, inviteeEmail: email.trim() });
      setInviteToken(data.data.inviteToken);
      setStatus('done');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? 'Error al generar la invitación');
      setStatus('error');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setEmail(''); setInviteToken(''); setStatus('idle'); setErrorMsg(''); setCopied(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div onClick={handleClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(8,10,15,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-xl)', padding: 28, width: 380, boxShadow: 'var(--shadow-neon-violet)', animation: 'modal-enter 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>Invitar colaborador</span>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}><Icon.Close /></button>
        </div>

        {status !== 'done' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label">Email del colaborador</label>
              <input className="input" type="email" placeholder="colaborador@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInvite()} />
            </div>
            {status === 'error' && (
              <div style={{ fontSize: 12, color: 'var(--neon-pink)', fontFamily: 'var(--font-mono)', padding: '8px 12px', background: 'rgba(255,45,107,0.1)', borderRadius: 'var(--radius-md)' }}>{errorMsg}</div>
            )}
            <button className="btn btn-primary" style={{ justifyContent: 'center', padding: 12 }} onClick={handleInvite} disabled={status === 'loading'}>
              {status === 'loading' ? 'Generando...' : 'Generar invitación'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--neon-green)', fontFamily: 'var(--font-mono)' }}>¡Invitación creada para <strong>{email}</strong>!</div>
            <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '0.1em', fontWeight: 700, color: 'var(--neon-cyan)', textAlign: 'center', wordBreak: 'break-all' }}>
              {inviteToken}
            </div>
            <button className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={handleCopy}>
              {copied ? '✓ Copiado' : 'Copiar token'}
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
              El colaborador debe aceptar en Zwing → "Unirse a Proyecto"
            </div>
            <button className="btn btn-ghost" style={{ justifyContent: 'center', fontSize: 10 }} onClick={handleClose}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ActivityFeed ──────────────────────────────────────────────────────────────
function ActivityFeed({ activity }: { activity: Activity[] }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--neon-violet)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon.Users /> Actividad
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {activity.length === 0 && <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Sin actividad reciente</div>}
        {activity.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(135deg, ${item.color}, ${item.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{item.avatar}</div>
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
function ProjectInfo({ name, bpm, collaborators, currentStep, isPlaying }: { name: string; bpm: number; collaborators: Collaborator[]; currentStep: number; isPlaying: boolean; }) {
  const secondsPerStep = 60 / bpm / 4;
  const totalSeconds = currentStep >= 0 ? Math.floor(currentStep * secondsPerStep) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const duracion = isPlaying && currentStep >= 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : '0:00';

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 32, marginBottom: 12 }}>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: `${20 + Math.sin(i * 0.8) * 10}px`, borderRadius: 2, background: 'var(--neon-green)', opacity: isPlaying ? 0.9 : 0.4, transition: 'opacity 0.3s' }} />
        ))}
      </div>
      <div style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6 }}>{name}</div>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 4 }}>BPM: <span style={{ color: 'var(--neon-cyan)' }}>{bpm}</span></div>
      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 12 }}>Tiempo: <span style={{ color: 'var(--text-primary)' }}>{duracion}</span></div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {collaborators.map((c, i) => (
          <div key={c.id} title={c.name} style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg, ${c.color}, ${c.color}88)`, border: '2px solid var(--bg-surface)', marginLeft: i > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{c.initial}</div>
        ))}
        {collaborators.length === 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Solo tú</span>}
      </div>
    </div>
  );
}

// ── ChannelRackPage ───────────────────────────────────────────────────────────
interface Project { id: string; name: string; collaborators?: any[]; projectOwner?: any; }

export function ChannelRackPage({ project, onBack }: { project: Project; onBack: () => void }) {
  const { sounds } = useSounds();
  const [wsChannels, setWsChannels] = useState<WsChannel[]>([]);
  const [rackLoaded, setRackLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(120);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [activity, setActivity] = useState<Activity[]>([]);

  // Build collaborators list from project data
  const collaborators: Collaborator[] = [
    ...(project.projectOwner ? [{ id: project.projectOwner.userId ?? 'owner', name: project.projectOwner.name ?? 'Propietario', initial: (project.projectOwner.name ?? 'P')[0].toUpperCase(), color: colorForIndex(0) }] : []),
    ...(project.collaborators ?? []).map((c: any, i: number) => ({ id: c.userId ?? c.id ?? String(i), name: c.name ?? c.email ?? 'Colaborador', initial: (c.name ?? c.email ?? 'C')[0].toUpperCase(), color: colorForIndex(i + 1) })),
  ];

  // Get collaborator name by userId
  const getCollaboratorName = useCallback((userId: string): string => {
    const collab = collaborators.find(c => c.id === userId);
    return collab?.name ?? (userId === 'owner' ? 'Propietario' : 'Alguien');
  }, [collaborators]);

  // ── Tone.js audio engine ──────────────────────────────────────────────────
  const playersRef = useRef<Map<string, Tone.Player>>(new Map());
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const wsChannelsRef = useRef<WsChannel[]>([]);
  wsChannelsRef.current = wsChannels;

  // Load players when channels or sounds load
  useEffect(() => {
    if (sounds.length === 0 || wsChannels.length === 0) return;
    const soundMap = new Map(sounds.map(s => [s.id, s.blobUrl]));
    wsChannels.forEach(ch => {
      if (playersRef.current.has(ch.id)) return;
      const url = soundMap.get(ch.soundId);
      if (!url) return;
      try { playersRef.current.set(ch.id, new Tone.Player(url).toDestination()); }
      catch (e) { console.warn('[Audio] load failed', ch.id, e); }
    });
    // Remove stale players
    const ids = new Set(wsChannels.map(c => c.id));
    playersRef.current.forEach((_, id) => { if (!ids.has(id)) { playersRef.current.get(id)?.dispose(); playersRef.current.delete(id); } });
  }, [wsChannels, sounds]);

  // Cleanup on unmount
  useEffect(() => () => {
    sequenceRef.current?.dispose();
    Tone.getTransport().stop();
    playersRef.current.forEach(p => p.dispose());
    playersRef.current.clear();
  }, []);

  // ── visual step sequencer ─────────────────────────────────────────────────
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(-1);

  const startVisual = useCallback(() => {
    const ms = (60 / bpm / 4) * 1000;
    intervalRef.current = setInterval(() => { stepRef.current = (stepRef.current + 1) % 16; setCurrentStep(stepRef.current); }, ms);
  }, [bpm]);

  const stopVisual = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    stepRef.current = -1; setCurrentStep(-1);
  }, []);

  // ── play / stop ───────────────────────────────────────────────────────────
  const audioStepRef = useRef(0);

  const startLocalPlayback = useCallback(async () => {
    if (sequenceRef.current) return;

    await Tone.start();
    Tone.getTransport().bpm.value = bpm;
    audioStepRef.current = 0;

    sequenceRef.current = new Tone.Sequence(
      (time) => {
        const step = audioStepRef.current;
        wsChannelsRef.current.forEach(ch => {
          if (ch.isMute || !ch.steps[step]) return;
          const player = playersRef.current.get(ch.id);
          if (player?.loaded) {
            try {
              player.volume.value = Tone.gainToDb(ch.volume / 100);
              player.start(time);
            } catch (_) { /* player may not be ready */ }
          }
        });
        audioStepRef.current = (step + 1) % 16;
      },
      [0], '16n'
    );

    sequenceRef.current.start(0);
    Tone.getTransport().start();
    startVisual();
    setIsPlaying(true);
  }, [bpm, startVisual]);

  const stopLocalPlayback = useCallback(() => {
    sequenceRef.current?.stop();
    sequenceRef.current?.dispose();
    sequenceRef.current = null;
    Tone.getTransport().stop();
    stopVisual();
    setIsPlaying(false);
  }, [stopVisual]);

  // ── WebSocket events ──────────────────────────────────────────────────────
  const handleRackEvent = useCallback((event: any) => {
    const payload = event.payload ?? event;
    const userName = getCollaboratorName(event.triggeredBy);

    switch (event.type) {
      case 'RACK_STATE': {
        const rack = payload.rack ?? payload;
        setWsChannels((rack.channels ?? []).map((ch: any) => ({ id: ch.channelId, name: ch.name, soundId: ch.soundId, volume: Math.round((ch.volume ?? 1) * 100), isMute: ch.active === false, steps: normalizeSteps(ch.steps) })));
        if (rack.bpm) setBpm(rack.bpm);
        setRackLoaded(true);
        break;
      }
      case 'CHANNEL_ADDED': {
        const ch = payload;
        setWsChannels(prev => [...prev, { id: ch.channelId, name: ch.name, soundId: ch.soundId, volume: Math.round((ch.volume ?? 1) * 100), isMute: ch.active === false, steps: normalizeSteps(ch.steps) }]);
        setActivity(prev => [{ user: userName, avatar: (userName ?? 'A')[0].toUpperCase(), action: 'agregó', target: ch.name, color: '#9B5DE5' }, ...prev.slice(0, 3)]);
        break;
      }
      case 'CHANNEL_REMOVED': {
        const channelId = payload.channelId ?? payload;
        setWsChannels(prev => prev.filter(c => c.id !== channelId));
        setActivity(prev => [{ user: userName, avatar: (userName ?? 'A')[0].toUpperCase(), action: 'eliminó', target: 'un canal', color: '#FF2D6B' }, ...prev.slice(0, 3)]);
        break;
      }
      case 'STEP_TOGGLED': {
        const { channelId, stepIndex, newValue } = payload;
        setWsChannels(prev => prev.map(ch => ch.id === channelId ? { ...ch, steps: ch.steps.map((s, i) => i === stepIndex ? newValue : s) } : ch));
        break;
      }
      case 'CHANNEL_UPDATED': {
        const ch = payload;
        setWsChannels(prev => prev.map(c => {
          if (c.id !== ch.channelId) return c;
          const updated = { ...c, name: ch.name ?? c.name, soundId: ch.soundId ?? c.soundId, volume: ch.volume != null ? Math.round(ch.volume * 100) : c.volume, isMute: ch.active != null ? !ch.active : c.isMute, steps: ch.steps ? normalizeSteps(ch.steps) : c.steps };
          // Reload player if sound changed
          if (ch.soundId && ch.soundId !== c.soundId) {
            const newSound = sounds.find(s => s.id === ch.soundId);
            if (newSound?.blobUrl) { playersRef.current.get(c.id)?.dispose(); try { playersRef.current.set(c.id, new Tone.Player(newSound.blobUrl).toDestination()); } catch (_) {} }
          }
          return updated;
        }));
        break;
      }
      case 'BPM_UPDATED': {
        if (typeof payload.bpm === 'number') {
          setBpm(payload.bpm);
        }
        break;
      }
      case 'PLAYBACK_STARTED': {
        void startLocalPlayback();
        setActivity(prev => [{ user: userName, avatar: (userName ?? 'A')[0].toUpperCase(), action: 'inició', target: 'reproducción', color: '#00F5D4' }, ...prev.slice(0, 3)]);
        break;
      }
      case 'PLAYBACK_STOPPED': {
        stopLocalPlayback();
        setActivity(prev => [{ user: userName, avatar: (userName ?? 'A')[0].toUpperCase(), action: 'detuvo', target: 'reproducción', color: '#FFB703' }, ...prev.slice(0, 3)]);
        break;
      }
    }
  }, [sounds, startLocalPlayback, stopLocalPlayback, getCollaboratorName]);

  const {
    toggleStep,
    addChannel,
    removeChannel,
    toggleMute,
    setVolume,
    setBpm: setRemoteBpm,
    startPlayback,
    stopPlayback,
  } = useRackSocket(project.id, handleRackEvent);

  const isRackLocked = isPlaying;

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      return;
    }

    startPlayback();
  }, [isPlaying, startPlayback]);

  const handleStop = useCallback(() => {
    stopPlayback();
    stopLocalPlayback();
  }, [stopPlayback, stopLocalPlayback]);

  const handleBpmChange = useCallback((fn: (b: number) => number) => {
    setBpm((prev) => {
      const next = fn(prev);
      setRemoteBpm(next);
      return next;
    });
  }, [setRemoteBpm]);

  // ── local channel handlers ────────────────────────────────────────────────
  const handleToggleMute = (channelId: string) => {
    const ch = wsChannels.find(c => c.id === channelId);
    if (!ch) return;
    setWsChannels(prev => prev.map(c => c.id === channelId ? { ...c, isMute: !c.isMute } : c));
    toggleMute(channelId, ch.isMute, ch.volume);
  };

  const handleVolumeChange = (channelId: string, volume: number) => {
    const ch = wsChannels.find(c => c.id === channelId);
    if (!ch) return;
    setWsChannels(prev => prev.map(c => c.id === channelId ? { ...c, volume } : c));
    setVolume(channelId, volume, !ch.isMute);
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-void)' }}>
      <TransportBar
        isPlaying={isPlaying}
        isRackLocked={isRackLocked}
        bpm={bpm}
        onPlay={handlePlay} onStop={handleStop}
        onBpmChange={handleBpmChange}
        projectName={project.name}
        collaborators={collaborators}
        onBack={onBack}
        onInvite={() => setInviteModalOpen(true)}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <SoundLibrary sounds={sounds} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 16, gap: 12 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--neon-violet)', display: 'flex', alignItems: 'center', gap: 6 }}><Icon.Music /> Channel Rack</span>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 12 }}>
                <div style={{ marginLeft: 168, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', flex: 1, gap: 3 }}>
                  {[1, 2, 3, 4].map(beat => (
                    <div key={beat} style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: currentStep >= (beat - 1) * 4 && currentStep < beat * 4 ? 'var(--neon-cyan)' : 'var(--text-muted)', fontWeight: currentStep >= (beat - 1) * 4 && currentStep < beat * 4 ? 700 : 400, paddingLeft: 4 }}>{beat}</div>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary" disabled={isRackLocked} style={{ padding: '5px 10px', fontSize: 10, opacity: isRackLocked ? 0.6 : 1, cursor: isRackLocked ? 'not-allowed' : 'pointer' }} onClick={() => { if (isRackLocked) return; if (sounds.length === 0) { alert('Espera a que carguen los sonidos...'); return; } setAddModalOpen(true); }}>
                <Icon.Plus /> Canal
              </button>
            </div>

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
                <ChannelRow key={channel.id} channel={channel} currentStep={currentStep} isPlaying={isPlaying} disabled={isRackLocked} index={i}
                  onToggleStep={stepIdx => { if (isRackLocked) return; toggleStep(channel.id, stepIdx); }}
                  onMute={() => handleToggleMute(channel.id)}
                  onVolumeChange={v => handleVolumeChange(channel.id, v)}
                  onRemove={() => { if (isRackLocked) return; removeChannel(channel.id); }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flexShrink: 0 }}>
            <ActivityFeed activity={activity} />
            <ProjectInfo name={project.name} bpm={bpm} collaborators={collaborators} currentStep={currentStep} isPlaying={isPlaying} />
          </div>
        </div>
      </div>

      <AddChannelModal open={addModalOpen} onClose={() => setAddModalOpen(false)} sounds={sounds} onAdd={(name, soundId) => addChannel(name, soundId)} />
      <InviteModal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} projectId={project.id} />
    </div>
  );
}