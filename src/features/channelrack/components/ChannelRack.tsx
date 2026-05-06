import { useState, useRef, useCallback, useEffect, useMemo} from 'react';
import { Icon } from '../../../shared/components/Icon';
import { TransportBar } from './TransportBar';
import { SoundLibrary } from './SoundPicker';
import { ChannelRow } from './Channel';
import { useRackSocket } from '../hooks/useRackSocket';
import { useSounds } from '../hooks/useSounds';
import { apiClient } from '../../../shared/api/client';
import { useAuthStore } from '../../auth/store/authStore';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { usePresence } from '../../presence/hooks/usePresence';
import { usePresenceStore } from '../../presence/store/presenceStore';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Sound { id: string; name: string; category: string; blobUrl: string; }

interface WsChannel {
  id: string; name: string; soundId: string;
  volume: number; isMute: boolean; steps: boolean[];
}

interface ChannelLockState {
  lockedByUserId?: string;
  lockedByEmail?: string;
}

interface Collaborator { id: string; initial: string; color: string; name: string; }
interface Activity { user: string; avatar: string; action: string; target: string; color: string; }

// Fallback palette used only when presence hasn't hydrated yet
const AVATAR_COLORS = ['#9B5DE5', '#FF2D6B', '#00F5D4', '#FFB703', '#06D6A0', '#1B4FE8'];

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

function InviteModal({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: string; }) {
  const [inviteToken, setInviteToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleInvite = async () => {
    setStatus('loading'); setErrorMsg('');
    try {
      const { data } = await apiClient.post('/api/invites', { projectId });
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
    setInviteToken(''); setStatus('idle'); setErrorMsg(''); setCopied(false);
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              Genera un código de acceso rápido para tu equipo. <br/>
              <strong style={{ color: "var(--neon-pink)" }}>Expira en 15 minutos.</strong>
            </p>
            {status === 'error' && (
              <div style={{ fontSize: 12, color: 'var(--neon-pink)', fontFamily: 'var(--font-mono)', padding: '8px 12px', background: 'rgba(255,45,107,0.1)', borderRadius: 'var(--radius-md)' }}>{errorMsg}</div>
            )}
            <button className="btn btn-primary" style={{ justifyContent: 'center', padding: 12, marginTop: 8 }} onClick={handleInvite} disabled={status === 'loading'}>
              {status === 'loading' ? 'Generando...' : 'Generar código'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--neon-green)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>¡Código generado con éxito!</div>
            <div style={{ background: 'var(--bg-deep)', border: '1px dashed var(--neon-violet)', borderRadius: 'var(--radius-md)', padding: '16px', fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.1em', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', cursor: 'pointer', userSelect: 'all' }}>
              {inviteToken}
            </div>
            <button className="btn btn-secondary" style={{ justifyContent: 'center' }} onClick={handleCopy}>
              {copied ? '✓ Copiado al portapapeles' : 'Copiar código'}
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
              El colaborador debe ingresar este código en su Dashboard.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ActivityFeed ──────────────────────────────────────────────────────────────
function ActivityFeed({ activity }: { activity: Activity[] }) {
  const visibleRows = 4;
  const rowHeight = 32;

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--neon-violet)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon.Users /> Actividad
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: visibleRows * rowHeight + (visibleRows - 1) * 8, overflowY: 'auto', paddingRight: 2 }}>
        {activity.length === 0 && <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Sin actividad reciente</div>}
        {activity.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: rowHeight }}>
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
  // FIX 1: load globals + project-scoped uploads, and grab refetch so the library
  // refreshes after a successful upload.
  const { sounds, refetch: refetchSounds } = useSounds(project.id);
  const user = useAuthStore((state) => state.user);
  const { startLoop, stopLoop, updateLoopData, previewSound } = useAudioEngine();
  const [wsChannels, setWsChannels] = useState<WsChannel[]>([]);
  const [channelLocks, setChannelLocks] = useState<Record<string, ChannelLockState>>({});
  const [rackLoaded, setRackLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [bpm, setBpm] = useState(120);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [activity, setActivity] = useState<Activity[]>([]);
  const myHeldLocksRef = useRef<Set<string>>(new Set());
  const unlockTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const roster = usePresenceStore(s => s.roster);
  const colorFor = usePresenceStore(s => s.colorFor);
  const nameFor = usePresenceStore(s => s.nameFor);
  const presenceList = useMemo(() => Object.values(roster), [roster]);

  const collaborators: Collaborator[] = presenceList.map((p) => ({
    id: p.userId,
    name: p.displayName ?? p.email,
    initial: (p.displayName ?? p.email ?? 'C')[0].toUpperCase(),
    color: p.color,
  }));

  const getCollaboratorName = useCallback((userId: string): string => {
    return nameFor(userId) ?? (userId === 'owner' ? 'Propietario' : 'Alguien');
  }, [nameFor]);

  const colorForUser = useCallback((userId: string | undefined | null): string => {
    const fromPresence = colorFor(userId);
    if (fromPresence) return fromPresence;
    if (!userId) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }, [colorFor]);

  useEffect(() => {
    const soundUrlMap = new Map(sounds.map((s) => [s.id, s.blobUrl]));
    updateLoopData(
      wsChannels.map((ch) => ({
        channelId: ch.id,
        soundId: ch.soundId,
        active: !ch.isMute,
        volume: ch.volume / 100,
        steps: ch.steps,
      })),
      soundUrlMap
    );
  }, [sounds, wsChannels, updateLoopData]);

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

  const startLocalPlayback = useCallback(() => {
    startLoop(bpm);
    startVisual();
    setIsPlaying(true);
  }, [bpm, startLoop, startVisual]);

  const stopLocalPlayback = useCallback(() => {
    stopLoop();
    stopVisual();
    setIsPlaying(false);
  }, [stopLoop, stopVisual]);

  const handleRackEvent = useCallback((event: any) => {
    const payload = event.payload ?? event;
    const userName = getCollaboratorName(event.triggeredBy);

    switch (event.type) {
      case 'RACK_STATE': {
        const rack = payload.rack ?? payload;
        setWsChannels((rack.channels ?? []).map((ch: any) => ({ id: ch.channelId, name: ch.name, soundId: ch.soundId, volume: Math.round((ch.volume ?? 1) * 100), isMute: ch.active === false, steps: normalizeSteps(ch.steps) })));
        setChannelLocks((prev) => {
          const channelIds = new Set((rack.channels ?? []).map((ch: any) => String(ch.channelId)));
          return Object.fromEntries(Object.entries(prev).filter(([channelId]) => channelIds.has(channelId)));
        });
        if (rack.bpm) setBpm(rack.bpm);
        setRackLoaded(true);
        break;
      }
      case 'CHANNEL_ADDED': {
        const ch = payload;
        setWsChannels(prev => [...prev, { id: ch.channelId, name: ch.name, soundId: ch.soundId, volume: Math.round((ch.volume ?? 1) * 100), isMute: ch.active === false, steps: normalizeSteps(ch.steps) }]);
        setActivity(prev => [{ user: userName, avatar: (userName ?? 'A')[0].toUpperCase(), action: 'agregó', target: ch.name, color: colorForUser(event.triggeredBy) }, ...prev.slice(0, 3)]);
        break;
      }
      case 'CHANNEL_REMOVED': {
        const channelId = payload.channelId ?? payload;
        setWsChannels(prev => prev.filter(c => c.id !== channelId));
        setChannelLocks(prev => {
          const { [String(channelId)]: _, ...rest } = prev;
          return rest;
        });
        setActivity(prev => [{ user: userName, avatar: (userName ?? 'A')[0].toUpperCase(), action: 'eliminó', target: 'un canal', color: colorForUser(event.triggeredBy) }, ...prev.slice(0, 3)]);
        break;
      }
      case 'CHANNEL_LOCKED': {
        const channelId = String(payload.channelId);
        setChannelLocks(prev => ({
          ...prev,
          [channelId]: {
            lockedByEmail: payload.lockedByEmail,
            lockedByUserId: payload.lockedByUserId,
          },
        }));
        setActivity(prev => [{ user: userName, avatar: (userName ?? 'A')[0].toUpperCase(), action: 'bloqueó', target: `canal ${channelId.slice(0, 6)}`, color: colorForUser(event.triggeredBy) }, ...prev.slice(0, 3)]);
        break;
      }
      case 'CHANNEL_UNLOCKED': {
        const channelId = String(payload.channelId);
        const timer = unlockTimersRef.current.get(channelId);
        if (timer) {
          clearTimeout(timer);
          unlockTimersRef.current.delete(channelId);
        }
        myHeldLocksRef.current.delete(channelId);
        setChannelLocks(prev => {
          const { [channelId]: _, ...rest } = prev;
          return rest;
        });
        setActivity(prev => [{ user: userName, avatar: (userName ?? 'A')[0].toUpperCase(), action: 'desbloqueó', target: `canal ${channelId.slice(0, 6)}`, color: colorForUser(event.triggeredBy) }, ...prev.slice(0, 3)]);
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
          return { ...c, name: ch.name ?? c.name, soundId: ch.soundId ?? c.soundId, volume: ch.volume != null ? Math.round(ch.volume * 100) : c.volume, isMute: ch.active != null ? !ch.active : c.isMute, steps: ch.steps ? normalizeSteps(ch.steps) : c.steps };
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
        setActivity(prev => [{ user: userName, avatar: (userName ?? 'A')[0].toUpperCase(), action: 'inició', target: 'reproducción', color: colorForUser(event.triggeredBy) }, ...prev.slice(0, 3)]);
        break;
      }
      case 'PLAYBACK_STOPPED': {
        stopLocalPlayback();
        setActivity(prev => [{ user: userName, avatar: (userName ?? 'A')[0].toUpperCase(), action: 'detuvo', target: 'reproducción', color: colorForUser(event.triggeredBy) }, ...prev.slice(0, 3)]);
        break;
      }
    }
  }, [startLocalPlayback, stopLocalPlayback, getCollaboratorName, colorForUser]);

  const {
    toggleStep,
    addChannel,
    removeChannel,
    toggleMute,
    setVolume,
    lockChannel,
    unlockChannel,
    setBpm: setRemoteBpm,
    startPlayback,
    stopPlayback,
    client,
    connected,
  } = useRackSocket(project.id, handleRackEvent);

  usePresence(project.id, client, connected);

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

  const clearUnlockTimer = useCallback((channelId: string) => {
    const timer = unlockTimersRef.current.get(channelId);
    if (!timer) return;
    clearTimeout(timer);
    unlockTimersRef.current.delete(channelId);
  }, []);

  const isLockedByOther = useCallback((channelId: string) => {
    const lock = channelLocks[channelId];
    if (!lock) return false;

    const holderEmail = lock.lockedByEmail?.trim().toLowerCase();
    const myEmail = user?.email?.trim().toLowerCase();

    if (holderEmail && myEmail) {
      return holderEmail !== myEmail;
    }

    return false;
  }, [channelLocks, user?.email]);

  const scheduleUnlock = useCallback((channelId: string, delayMs = 30000) => {
    clearUnlockTimer(channelId);
    const timer = setTimeout(() => {
      unlockChannel(channelId);
      myHeldLocksRef.current.delete(channelId);
      setChannelLocks((prev) => {
        const lock = prev[channelId];
        const myEmail = user?.email?.trim().toLowerCase();
        const holderEmail = lock?.lockedByEmail?.trim().toLowerCase();
        if (!lock || (holderEmail && myEmail && holderEmail !== myEmail)) {
          return prev;
        }
        const { [channelId]: _, ...rest } = prev;
        return rest;
      });
      unlockTimersRef.current.delete(channelId);
    }, delayMs);

    unlockTimersRef.current.set(channelId, timer);
  }, [clearUnlockTimer, unlockChannel, user?.email]);

  const withChannelLock = useCallback((channelId: string, action: () => void) => {
    if (isLockedByOther(channelId)) {
      return;
    }

    if (!myHeldLocksRef.current.has(channelId)) {
      lockChannel(channelId);
      myHeldLocksRef.current.add(channelId);
      if (user?.email) {
        setChannelLocks((prev) => ({
          ...prev,
          [channelId]: {
            lockedByEmail: user.email,
            lockedByUserId: prev[channelId]?.lockedByUserId,
          },
        }));
      }
    }

    action();
    scheduleUnlock(channelId);
  }, [isLockedByOther, lockChannel, scheduleUnlock, user?.email]);

  useEffect(() => {
    return () => {
      unlockTimersRef.current.forEach((timer) => clearTimeout(timer));
      unlockTimersRef.current.clear();

      myHeldLocksRef.current.forEach((channelId) => {
        unlockChannel(channelId);
      });
      myHeldLocksRef.current.clear();
    };
  }, [unlockChannel]);

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
        {/* FIX 2: pass the real project.id and the refetch fn from useSounds. */}
        <SoundLibrary
          sounds={sounds}
          projectId={project.id}
          onPreviewSound={previewSound}
          onSoundsChanged={refetchSounds}
        />

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
                <ChannelRow
                  key={channel.id}
                  channel={channel}
                  currentStep={currentStep}
                  isPlaying={isPlaying}
                  disabled={isRackLocked}
                  lockedByOther={isLockedByOther(channel.id)}
                  lockHolder={channelLocks[channel.id]?.lockedByEmail ?? channelLocks[channel.id]?.lockedByUserId}
                  index={i}
                  onToggleStep={stepIdx => {
                    const lockedByOther = isLockedByOther(channel.id);
                    if (isRackLocked || lockedByOther) return;
                    withChannelLock(channel.id, () => toggleStep(channel.id, stepIdx));
                  }}
                  onMute={() => handleToggleMute(channel.id)}
                  onVolumeChange={v => handleVolumeChange(channel.id, v)}
                  onRemove={() => {
                    const lockedByOther = isLockedByOther(channel.id);
                    if (isRackLocked || lockedByOther) return;
                    withChannelLock(channel.id, () => removeChannel(channel.id));
                  }}
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