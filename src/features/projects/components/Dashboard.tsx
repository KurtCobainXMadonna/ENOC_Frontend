import { useState } from 'react';
import { Icon } from '../../../shared/components/Icon';
import { Modal } from '../../../shared/components/Modal';
import { useProjects } from '../hooks/useProjects';

interface Project {
  id: string;
  name: string;
  owner: string;
  lastModified: string;
  isOwner: boolean;
}

interface DashboardProps {
  onOpenProject: (project: Project) => void;
}

export function Dashboard({ onOpenProject }: DashboardProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [projectName, setProjectName] = useState("Nuevo Beat");
  const [bpm, setBpm] = useState(120);
  const [inviteCode, setInviteCode] = useState("");
  const { ownedProjects, collaboratingProjects, createProject, deleteProject } = useProjects();
  const projects = [...ownedProjects, ...collaboratingProjects];
  const [contextMenu, setContextMenu] = useState<string | null>(null);

  const handleCreate = async () => {
    const newProject = await createProject(projectName);
    setCreateOpen(false);
    setProjectName('Nuevo Beat');
    onOpenProject(newProject);
  };

  const handleDelete = async (projectId: string) => {
    await deleteProject(projectId);
    setContextMenu(null);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse 70% 40% at 50% -10%, rgba(155,93,229,0.08) 0%, var(--bg-void) 60%)",
      padding: "0",
    }}>
      {/* Navbar */}
      <div style={{
        padding: "16px 32px", display: "flex", alignItems: "center",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-deep)",
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 28, letterSpacing: "-0.04em", color: "var(--text-primary)", textShadow: "0 0 30px rgba(155,93,229,0.5)" }}>
          ZWING
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--neon-violet), var(--neon-pink))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>H</div>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px" }}>
        {/* Action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>
          <button
            className="btn btn-primary"
            style={{ padding: "24px", justifyContent: "center", fontSize: 13, borderRadius: "var(--radius-lg)", flexDirection: "column", gap: 8 }}
            onClick={() => setCreateOpen(true)}
          >
            <span style={{ fontSize: 20 }}>+</span>
            <span>Crear Proyecto</span>
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: "24px", justifyContent: "center", fontSize: 13, borderRadius: "var(--radius-lg)", flexDirection: "column", gap: 8 }}
            onClick={() => setJoinOpen(true)}
          >
            <Icon.Users />
            <span>Unirse a Proyecto</span>
          </button>
        </div>

        {/* Projects table */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr auto auto auto",
            padding: "12px 20px", borderBottom: "1px solid var(--border-subtle)",
            fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)",
            fontWeight: 700,
          }}>
            <span>Proyecto</span>
            <span style={{ textAlign: "center", paddingRight: 60 }}>Última Notificación</span>
            <span style={{ textAlign: "center", paddingRight: 32 }}>Creado por</span>
            <span />
          </div>

          {projects.map((project, i) => (
            <div
              key={project.id}
              style={{
                display: "grid", gridTemplateColumns: "1fr auto auto auto",
                padding: "16px 20px", alignItems: "center", gap: 24,
                borderBottom: i < projects.length - 1 ? "1px solid var(--border-subtle)" : "none",
                cursor: "pointer", transition: "background 0.15s",
                animation: `slide-up 0.3s ease ${i * 0.05}s both`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              onClick={() => onOpenProject(project)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "var(--radius-md)",
                  background: `linear-gradient(135deg, rgba(155,93,229,0.3), rgba(255,45,107,0.2))`,
                  border: "1px solid var(--border-subtle)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--neon-violet)",
                }}>
                  <Icon.Music />
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>{project.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                    {project.isOwner ? "Propietario" : "Colaborador"}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{project.lastModified}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--neon-violet), var(--neon-pink))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700,
                }}>
                  {project.owner[0]}
                </div>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{project.owner}</span>
              </div>
              <div style={{ position: "relative" }}>
                <button
                  onClick={e => { e.stopPropagation(); setContextMenu(contextMenu === project.id ? null : project.id); }}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px 8px", borderRadius: "var(--radius-sm)" }}
                >
                  <Icon.More />
                </button>
                {contextMenu === project.id && (
                  <div style={{
                    position: "absolute", right: 0, top: "100%", zIndex: 100,
                    background: "var(--bg-card)", border: "1px solid var(--border-active)",
                    borderRadius: "var(--radius-md)", overflow: "hidden",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                    minWidth: 140, animation: "slide-up 0.15s ease",
                  }}>
                    <button
                      onClick={e => { e.stopPropagation(); onOpenProject(project); setContextMenu(null); }}
                      style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", fontSize: 12, textAlign: "left", fontFamily: "var(--font-ui)" }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)"}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "none"}
                    >
                      Compartir
                    </button>
                    {project.isOwner && (
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(project.id); }}
                        style={{ display: "block", width: "100%", padding: "10px 16px", background: "none", border: "none", color: "var(--neon-pink)", cursor: "pointer", fontSize: 12, textAlign: "left", fontFamily: "var(--font-ui)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,45,107,0.1)"}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "none"}
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
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Crear nuevo Proyecto">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="label">Nombre del proyecto:</label>
            <input className="input" value={projectName} onChange={e => setProjectName(e.target.value)} />
          </div>
          <div>
            <label className="label">BPM:</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input className="input" type="number" value={bpm} onChange={e => setBpm(Number(e.target.value))} style={{ flex: 1 }} />
              <button onClick={() => setBpm(b => Math.max(40, +b - 1))} className="btn btn-ghost" style={{ padding: "8px 12px" }}><Icon.Minus /></button>
              <button onClick={() => setBpm(b => Math.min(240, +b + 1))} className="btn btn-ghost" style={{ padding: "8px 12px" }}><Icon.Plus /></button>
            </div>
          </div>
          <div>
            <label className="label">Visibilidad:</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg-deep)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1 }}>Público</span>
              <div style={{
                width: 40, height: 22, background: "var(--neon-violet)", borderRadius: 11,
                position: "relative", cursor: "pointer",
              }}>
                <div style={{ position: "absolute", right: 3, top: 3, width: 16, height: 16, borderRadius: "50%", background: "#fff" }} />
              </div>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 12, marginTop: 4 }} onClick={handleCreate}>
            Crear Proyecto
          </button>
          <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            ¿Ya tienes un código de invitación?{" "}
            <button onClick={() => { setCreateOpen(false); setJoinOpen(true); }} style={{ background: "none", border: "none", color: "var(--neon-violet)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>
              Unirse a un Proyecto
            </button>
          </div>
        </div>
      </Modal>

      {/* Join Modal */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Unirse a un Proyecto">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="label">Código de invitación:</label>
            <input className="input" placeholder="X7D1F9" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} style={{ textAlign: "center", fontSize: 20, letterSpacing: "0.2em", fontWeight: 700 }} />
          </div>
          <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center", padding: 12, marginTop: 4 }}>
            Unirse al Proyecto
          </button>
          <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            ¿Nuevo en ZWING?{" "}
            <button onClick={() => { setJoinOpen(false); setCreateOpen(true); }} style={{ background: "none", border: "none", color: "var(--neon-violet)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>
              Crear nuevo Proyecto
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}