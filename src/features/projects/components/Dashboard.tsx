import { useState, useEffect } from 'react';
import { Icon } from '../../../shared/components/Icon';
import { Modal } from '../../../shared/components/Modal';
import { useProjectStore, FrontendProject } from '../store/projectStore';
import { useAuthStore } from '../../auth/store/authStore';

interface DashboardProps {
  onOpenProject: (project: FrontendProject) => void;
}

export function Dashboard({ onOpenProject }: DashboardProps) {
  const { ownedProjects, collaboratingProjects, isLoading, fetchProjects, createProject, deleteProject, acceptInvite } = useProjectStore();
  const { user, logout } = useAuthStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [projectName, setProjectName] = useState('Nuevo Beat');
  const [inviteCode, setInviteCode] = useState('');
  const [contextMenu, setContextMenu] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!projectName.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const project = await createProject(projectName.trim());
      setCreateOpen(false);
      setProjectName('Nuevo Beat');
      onOpenProject(project);
    } catch {
      setActionError('No se pudo crear el proyecto. Intenta de nuevo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      await deleteProject(projectId);
    } catch {
      console.error('Error al eliminar proyecto');
    }
    setContextMenu(null);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await acceptInvite(inviteCode.trim());
      await fetchProjects();
      setJoinOpen(false);
      setInviteCode('');
    } catch {
      setActionError('Código inválido o expirado.');
    } finally {
      setActionLoading(false);
    }
  };

  const allProjects = [...ownedProjects, ...collaboratingProjects];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 70% 40% at 50% -10%, rgba(155,93,229,0.08) 0%, var(--bg-void) 60%)',
    }}>
      {/* Navbar */}
      <div style={{
        padding: '16px 32px', display: 'flex', alignItems: 'center',
        borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-deep)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.04em', color: 'var(--text-primary)', textShadow: '0 0 30px rgba(155,93,229,0.5)' }}>
          ZWING
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {user.email}
            </span>
          )}
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--neon-violet), var(--neon-pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 10 }} onClick={() => logout()}>
            Salir
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 32px' }}>
        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 48 }}>
          <button className="btn btn-primary" style={{ padding: '24px', justifyContent: 'center', fontSize: 13, borderRadius: 'var(--radius-lg)', flexDirection: 'column', gap: 8 }} onClick={() => setCreateOpen(true)}>
            <span style={{ fontSize: 20 }}>+</span>
            <span>Crear Proyecto</span>
          </button>
          <button className="btn btn-secondary" style={{ padding: '24px', justifyContent: 'center', fontSize: 13, borderRadius: 'var(--radius-lg)', flexDirection: 'column', gap: 8 }} onClick={() => setJoinOpen(true)}>
            <Icon.Users />
            <span>Unirse a Proyecto</span>
          </button>
        </div>

        {/* Projects table */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
            <span>Proyecto</span>
            <span style={{ textAlign: 'center', paddingRight: 60 }}>Última Actividad</span>
            <span style={{ textAlign: 'center', paddingRight: 32 }}>Propietario</span>
            <span />
          </div>

          {isLoading && (
            <div style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
              Cargando proyectos...
            </div>
          )}

          {!isLoading && allProjects.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <div style={{ fontSize: 32, opacity: 0.3 }}>♪</div>
              <div>No tienes proyectos aún. ¡Crea uno!</div>
            </div>
          )}

          {allProjects.map((project, i) => (
            <div
              key={project.id}
              style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', padding: '16px 20px', alignItems: 'center', gap: 24, borderBottom: i < allProjects.length - 1 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer', transition: 'background 0.15s', animation: `slide-up 0.3s ease ${i * 0.05}s both` }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              onClick={() => onOpenProject(project)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, rgba(155,93,229,0.3), rgba(255,45,107,0.2))', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neon-violet)' }}>
                  <Icon.Music />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14 }}>{project.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                    {project.isOwner ? 'Propietario' : 'Colaborador'}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{project.lastModified}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--neon-violet), var(--neon-pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                  {project.owner.name[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{project.owner.name}</span>
              </div>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setContextMenu(contextMenu === project.id ? null : project.id); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}
                >
                  <Icon.More />
                </button>
                {contextMenu === project.id && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100, background: 'var(--bg-card)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', minWidth: 140, animation: 'slide-up 0.15s ease' }}>
                    {project.isOwner && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                        style={{ display: 'block', width: '100%', padding: '10px 16px', background: 'none', border: 'none', color: 'var(--neon-pink)', cursor: 'pointer', fontSize: 12, textAlign: 'left', fontFamily: 'var(--font-ui)' }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,45,107,0.1)')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'none')}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setActionError(null); }} title="Crear nuevo Proyecto">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Nombre del proyecto:</label>
            <input className="input" value={projectName} onChange={(e) => setProjectName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
          </div>
          {actionError && <p style={{ fontSize: 11, color: 'var(--neon-pink)', fontFamily: 'var(--font-mono)' }}>{actionError}</p>}
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} onClick={handleCreate} disabled={actionLoading}>
            {actionLoading ? 'Creando...' : 'Crear Proyecto'}
          </button>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ¿Tienes un código de invitación?{' '}
            <button onClick={() => { setCreateOpen(false); setJoinOpen(true); setActionError(null); }} style={{ background: 'none', border: 'none', color: 'var(--neon-violet)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              Unirse a un Proyecto
            </button>
          </div>
        </div>
      </Modal>

      {/* Join Modal */}
      <Modal open={joinOpen} onClose={() => { setJoinOpen(false); setActionError(null); }} title="Unirse a un Proyecto">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label">Token de invitación:</label>
            <input className="input" placeholder="Pega tu token de invitación" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
          </div>
          {actionError && <p style={{ fontSize: 11, color: 'var(--neon-pink)', fontFamily: 'var(--font-mono)' }}>{actionError}</p>}
          <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} onClick={handleJoin} disabled={actionLoading}>
            {actionLoading ? 'Uniéndose...' : 'Unirse al Proyecto'}
          </button>
        </div>
      </Modal>
    </div>
  );
}