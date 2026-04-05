export function TransportBar({ isPlaying, bpm, onPlay, onStop, onBpmChange, projectName, collaborators, onBack }) {
  return (
    <div style={{
      height: 52, background: "var(--bg-deep)",
      borderBottom: "1px solid var(--border-subtle)",
      display: "flex", alignItems: "center", gap: 16, padding: "0 16px",
      flexShrink: 0,
    }}>
      {/* Logo / Back */}
      <button
        onClick={onBack}
        style={{ background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.04em", color: "var(--text-primary)", textShadow: "0 0 20px rgba(155,93,229,0.4)" }}>
          ZWING
        </div>
      </button>

      <div style={{ width: 1, height: 28, background: "var(--border-subtle)" }} />

      {/* Transport controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "6px 10px" }}>
        <button
          onClick={onPlay}
          style={{
            width: 28, height: 28, border: "none", borderRadius: "var(--radius-sm)",
            background: isPlaying ? "rgba(0,245,212,0.15)" : "rgba(155,93,229,0.15)",
            color: isPlaying ? "var(--neon-cyan)" : "var(--neon-violet)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
        >
          {isPlaying ? <Icon.Pause /> : <Icon.Play />}
        </button>
        <button
          onClick={onStop}
          style={{
            width: 28, height: 28, border: "none", borderRadius: "var(--radius-sm)",
            background: "rgba(255,45,107,0.1)", color: "var(--neon-pink)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon.Stop />
        </button>
      </div>

      {/* BPM */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", padding: "6px 10px" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>BPM</span>
        <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--neon-cyan)", minWidth: 36, textAlign: "center" }}>
          {bpm}
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <button onClick={() => onBpmChange(b => Math.min(240, b + 1))} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", lineHeight: 1, padding: "1px 4px", fontSize: 10 }}>▲</button>
          <button onClick={() => onBpmChange(b => Math.max(40, b - 1))} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", lineHeight: 1, padding: "1px 4px", fontSize: 10 }}>▼</button>
        </div>
      </div>

      <div style={{ width: 1, height: 28, background: "var(--border-subtle)" }} />

      {/* Save */}
      <button className="btn btn-ghost" style={{ padding: "6px 10px", gap: 4 }}>
        <Icon.Save /> <span style={{ fontSize: 10 }}>Guardar</span>
      </button>

      {/* Add collaborator */}
      <button className="btn btn-ghost" style={{ padding: "6px 10px", gap: 4 }}>
        <Icon.Users /> <span style={{ fontSize: 10 }}>+</span>
      </button>

      {/* Settings */}
      <button className="btn btn-ghost" style={{ padding: "6px 10px" }}>
        <Icon.Settings />
      </button>

      <div style={{ flex: 1 }} />

      {/* Project name */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)", padding: "6px 14px",
        fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600,
        color: "var(--text-primary)", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 9, color: "var(--neon-violet)" }}>◈</span>
        {projectName}
      </div>

      {/* Collaborators */}
      <div style={{ display: "flex", alignItems: "center" }}>
        {collaborators.map((c, i) => (
          <div key={c.id} style={{
            width: 28, height: 28, borderRadius: "50%",
            background: `linear-gradient(135deg, ${c.color}, ${c.color}88)`,
            border: "2px solid var(--bg-deep)",
            marginLeft: i > 0 ? -8 : 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, cursor: "pointer",
            transition: "transform 0.15s",
            zIndex: collaborators.length - i,
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            {c.initial}
          </div>
        ))}
      </div>
    </div>
  );
}