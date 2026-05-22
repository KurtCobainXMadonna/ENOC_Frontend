const SAFE_PATH_SEGMENT = /^[A-Za-z0-9_-]+$/;

export function sanitizePathSegment(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || !SAFE_PATH_SEGMENT.test(trimmed)) {
    return null;
  }

  return encodeURIComponent(trimmed);
}