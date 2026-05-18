/**
 * Mirrors the backend Presence domain model
 * (org.eci.ZwingBackend.presence.domain.model.Presence).
 * Sent over:
 *   - GET  /api/projects/{projectId}/presence       (initial hydration)
 *   - WS   /topic/project/{projectId}/presence      (real-time updates)
 */
export interface Presence {
  projectId: string;
  userId: string;
  email: string;
  displayName: string;
  color: string;        // hex, assigned by backend from fixed 8-color palette
  connectedAt: string;  // ISO-8601 string (Instant serialized by Jackson JavaTimeModule)
}

/**
 * Broadcast envelope sent to /topic/project/{projectId}/presence on every
 * join/leave. Always contains the FULL current roster — frontend should
 * replace local state, not merge.
 */
export interface PresenceEvent {
  type: 'JOINED' | 'LEFT' | 'ROSTER_SNAPSHOT';
  changedUserId: string | null;
  roster: Presence[];
}
