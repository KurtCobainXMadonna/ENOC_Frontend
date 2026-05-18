// src/test/generalResponse.test.ts
// Tests para lógica de utilidades compartidas del frontend

import { describe, it, expect } from 'vitest'

// ── Helpers de utilidad (extraídos de useProjects.ts) ──────────────────────────

function toRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Reciente'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'Ahora mismo'
  if (minutes < 60) return `Hace ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

// ── Normalización de steps (extraída de ChannelRack.tsx) ────────────────────────

function normalizeSteps(raw: unknown): boolean[] {
  if (Array.isArray(raw)) return raw.map(Boolean)
  return Array(16).fill(false)
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('toRelativeTime', () => {
  it('retorna "Reciente" si no se pasa fecha', () => {
    expect(toRelativeTime()).toBe('Reciente')
    expect(toRelativeTime(undefined)).toBe('Reciente')
  })

  it('retorna "Ahora mismo" para fechas muy recientes', () => {
    const now = new Date().toISOString()
    expect(toRelativeTime(now)).toBe('Ahora mismo')
  })

  it('retorna formato de horas para fechas de hace pocas horas', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(toRelativeTime(twoHoursAgo)).toBe('Hace 2h')
  })

  it('retorna formato de días para fechas de hace días', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(toRelativeTime(threeDaysAgo)).toBe('Hace 3d')
  })

  it('retorna formato de fecha para fechas de más de una semana', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    const result = toRelativeTime(tenDaysAgo)
    // Verificar que retorna algo con formato de fecha
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})

describe('normalizeSteps', () => {
  it('convierte un array de booleanos correctamente', () => {
    const steps = normalizeSteps([true, false, true, false])
    expect(steps).toEqual([true, false, true, false])
  })

  it('convierte valores truthy/falsy', () => {
    const steps = normalizeSteps([1, 0, 'true', null, undefined, 'x'])
    expect(steps[0]).toBe(true)  // 1 → true
    expect(steps[1]).toBe(false) // 0 → false
    expect(steps[2]).toBe(true)  // 'true' → true
    expect(steps[3]).toBe(false) // null → false
    expect(steps[4]).toBe(false) // undefined → false
    expect(steps[5]).toBe(true)  // 'x' → true
  })

  it('retorna 16 pasos en false si el valor no es un array', () => {
    expect(normalizeSteps(null)).toHaveLength(16)
    expect(normalizeSteps(undefined)).toHaveLength(16)
    expect(normalizeSteps('cadena')).toHaveLength(16)
    expect(normalizeSteps(42)).toHaveLength(16)
    expect(normalizeSteps(null).every((s: boolean) => s === false)).toBe(true)
  })

  it('preserva un array de 16 pasos sin modificarlo', () => {
    const original = Array(16).fill(false)
    original[0] = true
    original[8] = true
    const result = normalizeSteps(original)
    expect(result[0]).toBe(true)
    expect(result[8]).toBe(true)
    expect(result.filter((s: boolean) => s).length).toBe(2)
  })
})

describe('presenceStore color logic', () => {
  const AVATAR_COLORS = ['#9B5DE5', '#FF2D6B', '#00F5D4', '#FFB703', '#06D6A0', '#1B4FE8']

  function colorForUser(userId: string | undefined | null): string {
    if (!userId) return AVATAR_COLORS[0]
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = (hash * 31 + userId.charCodeAt(i)) | 0
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
  }

  it('retorna el primer color si userId es null/undefined', () => {
    expect(colorForUser(null)).toBe(AVATAR_COLORS[0])
    expect(colorForUser(undefined)).toBe(AVATAR_COLORS[0])
  })

  it('retorna siempre el mismo color para el mismo userId', () => {
    const id = 'user-abc-123'
    expect(colorForUser(id)).toBe(colorForUser(id))
  })

  it('retorna un color válido del pallete para cualquier userId', () => {
    const ids = ['user-1', 'user-abc', '550e8400-e29b-41d4-a716-446655440000']
    ids.forEach(id => {
      expect(AVATAR_COLORS).toContain(colorForUser(id))
    })
  })
})