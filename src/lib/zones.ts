import { clamp01 } from './env'

/** The six depth zones of the descent. */
export interface ZoneDef {
  id: number
  key: string
  /** Serif display name (the human, poetic title). */
  name: string
  /** Mono depth label shown beneath the name. */
  depth: string
  /** Scroll progress where this zone begins. */
  start: number
}

export const ZONES: ZoneDef[] = [
  { id: 1, key: 'surface',    name: 'The Surface',     depth: '0 M',      start: 0.0 },
  { id: 2, key: 'twilight',   name: 'Twilight Zone',   depth: '200 M',    start: 0.10 },
  { id: 3, key: 'midnight',   name: 'Midnight Zone',   depth: '1000 M',   start: 0.21 },
  { id: 4, key: 'abyssal',    name: 'Abyssal Zone',    depth: '4000 M',   start: 0.33 },
  { id: 5, key: 'hadal',      name: 'Hadal Zone',      depth: '6000 M',   start: 0.45 },
  { id: 6, key: 'challenger', name: 'Challenger Deep', depth: '11000 M',  start: 0.55 },
  { id: 7, key: 'floor',      name: 'The Ocean Floor', depth: '11034 M',  start: 0.64 },
]

/** ScrollTrigger band edges (start of each zone 2..6) as percentage strings. */
export const ZONE_STARTS = ZONES.slice(1).map((z) => `${z.start * 100}%`)

// ── Piecewise-linear interpolation of real metrics over scroll ───────────────
const SCROLL_STOPS = [0, 0.10, 0.21, 0.33, 0.45, 0.55, 0.64, 1.0]
const DEPTH_STOPS = [0, 200, 1000, 4000, 6000, 11000, 11034, 11034]
const TEMP_STOPS = [19, 14, 4, 2.2, 1.8, 1.6, 1.5, 1.5]

function piecewise(s: number, ys: number[]): number {
  const x = clamp01(s)
  for (let i = 1; i < SCROLL_STOPS.length; i++) {
    if (x <= SCROLL_STOPS[i]) {
      const t = (x - SCROLL_STOPS[i - 1]) / (SCROLL_STOPS[i] - SCROLL_STOPS[i - 1])
      return ys[i - 1] + (ys[i] - ys[i - 1]) * t
    }
  }
  return ys[ys.length - 1]
}

/** Live depth in metres for a scroll value. */
export const depthForScroll = (s: number) => piecewise(s, DEPTH_STOPS)
/** Live water temperature in °C. */
export const tempForScroll = (s: number) => piecewise(s, TEMP_STOPS)
/** Live pressure in atmospheres (≈ 1 ATM per 10 m + surface 1 ATM). */
export const pressureForScroll = (s: number) => depthForScroll(s) / 10 + 1
