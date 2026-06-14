import type { MutableRefObject } from 'react'

/**
 * AbyssEnv — the single shared per-frame state object.
 *
 * Scene.tsx owns one of these in a ref, updates it every frame from the scroll
 * progress + velocity, and passes the ref down to every canvas component. This
 * keeps the descent perfectly synchronised without prop-drilling dozens of refs.
 */
export interface AbyssEnv {
  /** Normalised scroll progress, 0 (surface) → 1 (challenger deep). */
  scroll: number
  /** Smoothed scroll velocity magnitude (drives particle reactivity). */
  vel: number
  /** Ambient light level, 1 (sunlit surface) → 0 (total dark). */
  light: number
  /** Particle density multiplier, ~0.35 (surface) → 1 (hadal+). */
  density: number
  /** Stillness, 0 (everything drifts) → 1 (challenger — motion freezes). */
  stillness: number
  /** Global intro reveal, 0 → 1, driven by the boot timeline. */
  reveal: number
  /** Per-zone smoothstepped progress within each band, index 0..6 (7 zones). */
  zone: number[]
  /** Ocean-floor chapter progress, 0 (still descending) → 1 (deep into it). */
  floor: number
  /** Camera level-out, 0 (vertical descent) → 1 (horizontal forward travel). */
  level: number
  /** Forward exploration progress across the seabed, 0 → 1. */
  travel: number
}

export type EnvRef = MutableRefObject<AbyssEnv>

export function createEnv(): AbyssEnv {
  return {
    scroll: 0,
    vel: 0,
    light: 1,
    density: 0.35,
    stillness: 0,
    reveal: 0,
    zone: [0, 0, 0, 0, 0, 0, 0],
    floor: 0,
    level: 0,
    travel: 0,
  }
}

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
export const smoothstep = (x: number) => x * x * (3 - 2 * x)
export const ss01 = (x: number) => smoothstep(clamp01(x))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
