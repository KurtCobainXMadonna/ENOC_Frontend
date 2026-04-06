import { useEffect, useState } from 'react';
import { Icon } from '../../../shared/components/Icon';
import { api } from '../../../shared/api/client';

interface Sound { id: string; name: string; category: string; blobUrl: string; }

export function SoundLibrary({ sounds: initialSounds = [] }: { sounds?: Sound[] }) {
  const [sounds, setSounds] = useState<Sound[]>(initialSounds);

  useEffect(() => {
    api.get('/api/sounds').then(res => setSounds(res.data.data));
  }, []);

  const [search, setSearch] = useState('');
  const filtered = sounds.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const categories = [...new Set(filtered.map(s => s.category))];

  return (
    <div style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)', width: 180, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--neon-violet)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon.Music /> Biblioteca
        </div>
        <div style={{ position: 'relative' }}>
          <input className="input" style={{ fontSize: 11, padding: '7px 10px 7px 28px' }} placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><Icon.Search /></span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {categories.map(cat => (
          <div key={cat}>
            <div style={{ padding: '4px 12px', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>{cat}</div>
            {filtered.filter(s => s.category === cat).map(sound => (
              <div key={sound.id} draggable onDragStart={e => e.dataTransfer.setData('soundId', sound.id)}
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'grab', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--neon-violet)' }}>
                  <Icon.Waveform />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sound.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>.wav</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}