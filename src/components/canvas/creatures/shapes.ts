// Procedural particle silhouettes. Every creature is a cloud of points centred
// at the origin, ~1–3 world units, swimming along +X (head toward +X, tail -X).
// ParticleCreature scales, positions, animates and dissolves them — these
// builders only describe form. Rendered as additive glow + bloom, so an
// evocative silhouette matters more than anatomical precision.

const TAU = Math.PI * 2
const rnd = () => Math.random()

/** Fill an ellipsoid volume. */
function ellipsoid(out: number[], n: number, cx: number, cy: number, cz: number, rx: number, ry: number, rz: number) {
  for (let i = 0; i < n; i++) {
    const u = rnd() * TAU
    const v = Math.acos(2 * rnd() - 1)
    const r = Math.cbrt(rnd())
    out.push(cx + Math.sin(v) * Math.cos(u) * rx * r, cy + Math.sin(v) * Math.sin(u) * ry * r, cz + Math.cos(v) * rz * r)
  }
}

/** A tapering fish/whale body along X with tail flukes and a dorsal hint. */
function finnedBody(out: number[], n: number, len: number, h: number, w: number, fluke: 'vertical' | 'horizontal' = 'vertical') {
  const bodyN = Math.floor(n * 0.78)
  for (let i = 0; i < bodyN; i++) {
    const u = rnd()
    const x = (u - 0.55) * len
    const prof = Math.pow(Math.sin(Math.PI * Math.min(u * 1.04, 1)), 0.7) // fat front, taper tail
    const a = rnd() * TAU
    const rad = Math.sqrt(rnd())
    out.push(x, Math.cos(a) * rad * h * 0.5 * prof, Math.sin(a) * rad * w * 0.5 * prof)
  }
  // tail fin
  const tailN = Math.floor(n * 0.13)
  for (let i = 0; i < tailN; i++) {
    const x = -len * 0.5 - rnd() * len * 0.16
    const s = (rnd() - 0.5) * h * 1.1
    if (fluke === 'vertical') out.push(x, s, (rnd() - 0.5) * w * 0.15)
    else out.push(x, (rnd() - 0.5) * h * 0.15, s)
  }
  // dorsal fin
  const dorN = Math.floor(n * 0.09)
  for (let i = 0; i < dorN; i++) {
    const u = 0.25 + rnd() * 0.3
    out.push((u - 0.55) * len, h * (0.5 + rnd() * 0.5), (rnd() - 0.5) * w * 0.1)
  }
}

/** Long trailing strands (tentacles, arms). */
function strands(out: number[], strandCount: number, perStrand: number, originX: number, spread: number, length: number, waviness: number) {
  for (let s = 0; s < strandCount; s++) {
    const baseY = (rnd() - 0.5) * spread
    const baseZ = (rnd() - 0.5) * spread
    const phase = rnd() * TAU
    for (let i = 0; i < perStrand; i++) {
      const t = i / perStrand
      const x = originX - t * length
      out.push(
        x + Math.sin(t * 6 + phase) * waviness * 0.3,
        baseY + Math.sin(t * 5 + phase) * waviness * (0.3 + t),
        baseZ + Math.cos(t * 5 + phase) * waviness * (0.3 + t),
      )
    }
  }
}

const f32 = (a: number[]) => new Float32Array(a)

// ── Creatures ────────────────────────────────────────────────────────────────

export function whale(n = 4200): Float32Array {
  const p: number[] = []
  finnedBody(p, n, 7.5, 1.7, 1.2, 'horizontal')
  // pectoral fins
  for (let i = 0; i < n * 0.06; i++) {
    const side = rnd() < 0.5 ? 1 : -1
    p.push(1.0 + rnd() * 0.6, -0.2 + rnd() * 0.2, side * (0.6 + rnd() * 1.0))
  }
  return f32(p)
}

export function jellyfish(n = 1400): Float32Array {
  const p: number[] = []
  // bell — hemisphere dome
  const bellN = Math.floor(n * 0.5)
  for (let i = 0; i < bellN; i++) {
    const a = rnd() * TAU
    const r = Math.sqrt(rnd())
    const rad = r * 0.9
    p.push(Math.cos(a) * rad, Math.cos(r * Math.PI * 0.5) * 0.7, Math.sin(a) * rad)
  }
  strands(p, 14, Math.floor((n * 0.5) / 14), 0, 0.7, 2.4, 0.5)
  return f32(p)
}

export function smallFish(n = 220): Float32Array {
  const p: number[] = []
  finnedBody(p, n, 0.9, 0.28, 0.16)
  return f32(p)
}

/** A drifting school — many tiny fish scattered through a volume. */
export function fishSchool(fish = 60, perFish = 26): Float32Array {
  const p: number[] = []
  for (let f = 0; f < fish; f++) {
    const ox = (rnd() - 0.5) * 9
    const oy = (rnd() - 0.5) * 4
    const oz = (rnd() - 0.5) * 5
    for (let i = 0; i < perFish; i++) {
      const u = rnd()
      const x = (u - 0.5) * 0.7
      const prof = Math.sin(Math.PI * u)
      p.push(ox + x, oy + (rnd() - 0.5) * 0.18 * prof, oz + (rnd() - 0.5) * 0.1 * prof)
    }
  }
  return f32(p)
}

export function anglerfish(n = 1300): Float32Array {
  const p: number[] = []
  finnedBody(p, n, 2.2, 1.5, 1.3) // round, bulbous body
  // illicium stalk + lure (the bright tip lives at the very front)
  for (let i = 0; i < n * 0.05; i++) {
    const t = rnd()
    p.push(1.1 + t * 1.3, 0.4 + t * 1.1, (rnd() - 0.5) * 0.1)
  }
  // lure cluster
  ellipsoid(p, Math.floor(n * 0.04), 2.4, 1.5, 0, 0.12, 0.12, 0.12)
  return f32(p)
}

export function squid(n = 1600): Float32Array {
  const p: number[] = []
  ellipsoid(p, Math.floor(n * 0.5), 0.4, 0, 0, 2.0, 0.6, 0.6) // mantle (cone-ish)
  strands(p, 10, Math.floor((n * 0.5) / 10), -1.4, 0.5, 2.6, 0.6) // arms
  return f32(p)
}

export function siphonophore(n = 1600): Float32Array {
  const p: number[] = []
  // a long chain of small translucent blobs
  const links = 40
  for (let l = 0; l < links; l++) {
    const t = l / links
    ellipsoid(p, Math.floor(n / links), (t - 0.5) * 9, Math.sin(t * 9) * 0.4, Math.cos(t * 9) * 0.4, 0.18, 0.18, 0.18)
  }
  return f32(p)
}

export function giantSquid(n = 5000): Float32Array {
  const p: number[] = []
  ellipsoid(p, Math.floor(n * 0.45), 1.5, 0, 0, 3.6, 0.9, 0.9) // huge mantle
  strands(p, 8, Math.floor((n * 0.4) / 8), -2.0, 0.7, 7.5, 1.0) // 8 long arms
  strands(p, 2, Math.floor((n * 0.15) / 2), -2.0, 0.3, 10.5, 1.4) // 2 longer tentacles
  return f32(p)
}

export function gulperEel(n = 3000): Float32Array {
  const p: number[] = []
  // enormous mouth (open cone) at head
  for (let i = 0; i < n * 0.3; i++) {
    const t = rnd()
    const a = rnd() * TAU
    const rad = (1 - t) * 1.6
    p.push(2.0 + t * 1.4, Math.cos(a) * rad, Math.sin(a) * rad)
  }
  // long whip body + tail
  for (let i = 0; i < n * 0.7; i++) {
    const t = rnd()
    const x = 2.0 - t * 9
    const r = (1 - t) * 0.25 + 0.03
    const a = rnd() * TAU
    p.push(x + Math.sin(t * 8) * 0.4, Math.cos(a) * r + Math.sin(t * 6) * 0.5, Math.sin(a) * r)
  }
  return f32(p)
}

export function giantIsopod(n = 2200): Float32Array {
  const p: number[] = []
  // segmented flattened oval
  const segs = 9
  for (let s = 0; s < segs; s++) {
    const t = s / (segs - 1)
    const x = (t - 0.5) * 3.2
    const w = Math.sin(Math.PI * Math.min(t * 1.1, 1)) * 1.1
    ellipsoid(p, Math.floor((n * 0.8) / segs), x, 0, 0, 0.22, 0.5, w)
  }
  // legs
  for (let i = 0; i < n * 0.2; i++) {
    const side = rnd() < 0.5 ? 1 : -1
    const x = (rnd() - 0.5) * 3.0
    p.push(x, -0.3 - rnd() * 0.4, side * (1.0 + rnd() * 0.5))
  }
  return f32(p)
}

/** Hadal: a mostly-hidden silhouette — large, vague, never fully revealed. */
export function hadalShape(n = 4000): Float32Array {
  const p: number[] = []
  finnedBody(p, n, 9, 2.6, 1.8)
  return f32(p)
}
