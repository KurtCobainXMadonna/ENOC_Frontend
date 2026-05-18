import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../../../shared/api/client';
import { Icon } from '../../../shared/components/Icon';

const CATEGORIES = ['KICK', 'SNARE', 'HIHAT', 'CLAP', 'SYNTH', 'SAMPLE'] as const;
type Category = (typeof CATEGORIES)[number];

const ALLOWED_MIME = new Set([
  'audio/wav', 'audio/wave', 'audio/x-wav',
  'audio/mpeg', 'audio/mp3',
  'audio/ogg',
  'audio/mp4', 'audio/aac', 'audio/x-m4a',
  'audio/flac',
  'audio/webm',
  'video/mp4',
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB — must match backend SoundService.MAX_UPLOAD_BYTES

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onUploaded: () => void; // parent re-fetches sounds
}

export function UploadSoundModal({ open, onClose, projectId, onUploaded }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('SAMPLE');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Reset every time the modal is reopened.
  useEffect(() => {
    if (open) {
      setFile(null);
      setName('');
      setCategory('SAMPLE');
      setDescription('');
      setStatus('idle');
      setErrorMsg('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open]);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    setErrorMsg('');
    if (!picked) {
      setFile(null);
      return;
    }
    if (picked.size > MAX_BYTES) {
      setErrorMsg('El archivo supera el límite de 10MB.');
      setFile(null);
      return;
    }
    if (picked.type && !ALLOWED_MIME.has(picked.type.toLowerCase())) {
      setErrorMsg(`Formato no soportado: ${picked.type || 'desconocido'}.`);
      setFile(null);
      return;
    }
    setFile(picked);
    // Pre-fill the name with the filename (sin extensión) si está vacío.
    if (!name.trim()) {
      const base = picked.name.replace(/\.[^.]+$/, '');
      setName(base);
    }
  };

  const handleSubmit = async () => {
    // Defensive guard — must live INSIDE the handler, not at component top level
    // (otherwise it runs on every render and causes "Too many re-renders").
    if (!projectId || projectId === 'undefined') {
      setErrorMsg('No se pudo identificar el proyecto. Recarga la página.');
      return;
    }
    if (!file) {
      setErrorMsg('Selecciona un archivo de audio.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('El nombre del sonido es obligatorio.');
      return;
    }
    setStatus('uploading');
    setErrorMsg('');

    const form = new FormData();
    form.append('file', file);
    form.append('projectId', projectId);
    form.append('name', name.trim());
    form.append('category', category);
    if (description.trim()) form.append('description', description.trim());

    try {
      await apiClient.post('/api/sounds/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded();
      onClose();
    } catch (err: any) {
      const backendMsg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        'Error al subir el sonido.';
      setErrorMsg(backendMsg);
      setStatus('error');
    }
  };

  const isUploading = status === 'uploading';

  return (
    <div
      onClick={() => !isUploading && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(8,10,15,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-xl)',
          padding: 28,
          width: 420,
          boxShadow: 'var(--shadow-neon-violet)',
          animation: 'modal-enter 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>
            Subir sonido al proyecto
          </span>
          <button
            onClick={onClose}
            disabled={isUploading}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: isUploading ? 'not-allowed' : 'pointer', padding: 4,
            }}
          >
            <Icon.Close />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Archivo de audio</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/mp4"
              onChange={handleFileChange}
              disabled={isUploading}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--bg-deep)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
            />
            {file && (
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {file.name} — {(file.size / 1024).toFixed(1)} KB
              </div>
            )}
          </div>

          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Kick 808 personalizado"
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="label">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              disabled={isUploading}
              style={{
                width: '100%', padding: '10px 14px',
                background: 'var(--bg-deep)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none',
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Descripción (opcional)</label>
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas internas"
              disabled={isUploading}
            />
          </div>

          {errorMsg && (
            <div style={{
              fontSize: 12, color: 'var(--neon-pink)',
              fontFamily: 'var(--font-mono)',
              padding: '8px 12px',
              background: 'rgba(255,45,107,0.1)',
              borderRadius: 'var(--radius-md)',
            }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              className="btn btn-ghost"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={onClose}
              disabled={isUploading}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={handleSubmit}
              disabled={isUploading || !file || !name.trim()}
            >
              {isUploading ? 'Subiendo...' : 'Subir'}
            </button>
          </div>

          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
            Solo visible dentro de este proyecto · máx. 10MB
          </div>
        </div>
      </div>
    </div>
  );
}