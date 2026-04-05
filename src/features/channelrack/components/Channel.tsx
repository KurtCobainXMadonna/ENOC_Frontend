import { useState } from 'react';
import { Icon } from '../../../shared/components/Icon';
import { StepButton } from './StepGrid';

interface Channel {
  id: string; name: string; soundId: string;
  volume: number; isMute: boolean; steps: boolean[];
}

interface ChannelRowProps {
  channel: Channel;
  currentStep: number;
  isPlaying: boolean;
  index: number;
  onToggleStep: (stepIdx: number) => void;
  onMute: () => void;
  onVolumeChange: (volume: number) => void;
  onRemove: () => void;
}

export function ChannelRow({ channel, currentStep, isPlaying, onToggleStep, onMute, onVolumeChange, onRemove, index }: ChannelRowProps) {
  const [_showVolume, setShowVolume] = useState(false);

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '160px 28px 28px 1fr 28px',
      alignItems: 'center', gap: 8, padding: '6px 0',
      borderBottom: '1px solid var(--border-subtle)',
      animation: `slide-up 0.3s ease ${index * 0.06}s both`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: channel.isMute ? 'var(--text-muted)' : 'var(--neon-green)', boxShadow: channel.isMute ? 'none' : '0 0 6px var(--neon-green)', transition: 'all 0.2s' }} />
        <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: `conic-gradient(var(--neon-violet) ${channel.volume * 3.6}deg, var(--bg-deep) 0)`, border: '2px solid var(--bg-raised)', cursor: 'pointer', position: 'relative' }} onClick={() => setShowVolume(v => !v)}>
          <div style={{ position: 'absolute', inset: 3, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: 'var(--text-secondary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {channel.volume}
          </div>
          {_showVolume && (
            <input
              type="range"
              min="0"
              max="100"
              value={channel.volume}
              onChange={e => onVolumeChange(Number(e.target.value))}
              style={{
                position: 'absolute',
                width: '60px',
                bottom: '32px',
                left: '50%',
                transform: 'translateX(-50%)',
                cursor: 'pointer',
              }}
            />
          )}
        </div>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: channel.isMute ? 'var(--text-muted)' : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
          {channel.name}
        </span>
      </div>

      <button onClick={onMute} style={{ width: 28, height: 28, border: 'none', borderRadius: 'var(--radius-sm)', background: channel.isMute ? 'rgba(255,45,107,0.2)' : 'var(--bg-raised)', color: channel.isMute ? 'var(--neon-pink)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
        {channel.isMute ? <Icon.Mute /> : <Icon.Sound />}
      </button>

      <div style={{ width: 4, height: 28, borderRadius: 2, flexShrink: 0, background: index % 2 === 0 ? 'var(--neon-violet)' : 'var(--neon-pink)', opacity: 0.7 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(16, 1fr)', gap: 3 }}>
        {channel.steps.map((active, stepIdx) => (
          <StepButton key={stepIdx} active={active} beat={stepIdx % 4 === 0} playing={isPlaying && currentStep === stepIdx} accent={active && Math.floor(stepIdx / 4) % 2 === 1} onClick={() => onToggleStep(stepIdx)} />
        ))}
      </div>

      <button onClick={onRemove} style={{ width: 28, height: 28, border: 'none', borderRadius: 'var(--radius-sm)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,45,107,0.15)'; e.currentTarget.style.color = 'var(--neon-pink)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <Icon.More />
      </button>
    </div>
  );
}