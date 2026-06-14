// Particle silhouettes for the ocean-floor relics. Each is a point cloud with
// its base near y=0 so it rests on the seabed, modest scale (~1–3 units before
// FloorObject scaling). Evocative form over precision — additive glow + bloom.

const TAU = Math.PI * 2
const rnd = () => Math.random()
const f32 = (a: number[]) => new Float32Array(a)

function box(o: number[], n: number, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) {
  for (let i = 0; i < n; i++) o.push(cx + (rnd() - 0.5) * sx, cy + (rnd() - 0.5) * sy, cz + (rnd() - 0.5) * sz)
}

function cyl(o: number[], n: number, cx: number, cy: number, cz: number, r: number, h: number) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * TAU
    const rr = Math.sqrt(rnd()) * r
    o.push(cx + Math.cos(a) * rr, cy + rnd() * h, cz + Math.sin(a) * rr)
  }
}

function shell(o: number[], n: number, cx: number, cy: number, cz: number, r: number) {
  for (let i = 0; i < n; i++) {
    const a = rnd() * TAU
    const v = Math.acos(2 * rnd() - 1)
    o.push(cx + Math.sin(v) * Math.cos(a) * r, cy + Math.cos(v) * r, cz + Math.sin(v) * Math.sin(a) * r)
  }
}

// Ring lying in a chosen plane
function ring(o: number[], n: number, cx: number, cy: number, cz: number, R: number, thick: number, plane: 'xy' | 'xz') {
  for (let i = 0; i < n; i++) {
    const a = rnd() * TAU
    const rr = R + (rnd() - 0.5) * thick
    if (plane === 'xy') o.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, cz + (rnd() - 0.5) * thick)
    else o.push(cx + Math.cos(a) * rr, cy + (rnd() - 0.5) * thick, cz + Math.sin(a) * rr)
  }
}

export function chest(n = 2600): Float32Array {
  const o: number[] = []
  box(o, Math.floor(n * 0.45), 0, 0.45, 0, 2.0, 0.9, 1.2) // body
  box(o, Math.floor(n * 0.3), 0, 1.05, 0, 2.0, 0.5, 1.2) // domed lid
  // metal banding
  box(o, Math.floor(n * 0.06), -0.7, 0.7, 0, 0.12, 1.4, 1.25)
  box(o, Math.floor(n * 0.06), 0.7, 0.7, 0, 0.12, 1.4, 1.25)
  // encrusting shells / algae
  for (let i = 0; i < n * 0.13; i++) shell(o, 1, (rnd() - 0.5) * 2, 0.2 + rnd() * 1.1, (rnd() - 0.5) * 1.2, 0.04)
  return f32(o)
}

// Hollow glass bottle — a shell so the message inside is visible.
export function bottle(n = 1300): Float32Array {
  const o: number[] = []
  // body wall
  for (let i = 0; i < n * 0.5; i++) {
    const a = rnd() * TAU
    o.push(Math.cos(a) * 0.27, rnd() * 1.0, Math.sin(a) * 0.27)
  }
  // shoulder taper to the neck
  for (let i = 0; i < n * 0.18; i++) {
    const t = rnd()
    const r = 0.27 + (0.11 - 0.27) * t
    const a = rnd() * TAU
    o.push(Math.cos(a) * r, 1.0 + t * 0.22, Math.sin(a) * r)
  }
  // neck
  for (let i = 0; i < n * 0.18; i++) {
    const a = rnd() * TAU
    o.push(Math.cos(a) * 0.11, 1.22 + rnd() * 0.4, Math.sin(a) * 0.11)
  }
  // cork
  for (let i = 0; i < n * 0.14; i++) {
    const a = rnd() * TAU
    const rr = Math.sqrt(rnd()) * 0.1
    o.push(Math.cos(a) * rr, 1.62 + rnd() * 0.13, Math.sin(a) * rr)
  }
  return f32(o)
}

// The rolled message sealed inside the bottle.
export function messageScroll(n = 600): Float32Array {
  const o: number[] = []
  // rolled tube of parchment
  for (let i = 0; i < n * 0.72; i++) {
    const a = rnd() * TAU
    o.push(Math.cos(a) * 0.12, 0.2 + rnd() * 0.55, Math.sin(a) * 0.12)
  }
  // a slightly unfurled edge (a corner of the message)
  for (let i = 0; i < n * 0.28; i++) {
    const t = rnd()
    o.push((rnd() - 0.5) * 0.16, 0.25 + t * 0.5, 0.12 + rnd() * 0.07)
  }
  return f32(o)
}

export function anchor(n = 3200): Float32Array {
  const o: number[] = []
  box(o, Math.floor(n * 0.4), 0, 1.6, 0, 0.22, 3.0, 0.22) // shank
  ring(o, Math.floor(n * 0.18), 0, 3.1, 0, 0.42, 0.12, 'xy') // top ring
  box(o, Math.floor(n * 0.12), 0, 0.55, 0, 1.7, 0.2, 0.2) // stock (crossbar)
  // two curved arms / flukes at the base
  for (let i = 0; i < n * 0.3; i++) {
    const side = rnd() < 0.5 ? 1 : -1
    const t = rnd()
    const x = side * t * 1.5
    const y = 0.2 - Math.sin(t * Math.PI * 0.5) * 0.1 + (1 - t) * 0.2
    o.push(x, Math.max(0.0, y), (rnd() - 0.5) * 0.2)
  }
  return f32(o)
}

// Rotate every point in place — used to settle the wreck into a list/pitch.
function rotateAll(o: number[], rx: number, rz: number) {
  const cx = Math.cos(rx), sx = Math.sin(rx)
  const cz = Math.cos(rz), sz = Math.sin(rz)
  for (let i = 0; i < o.length; i += 3) {
    const x = o[i], y = o[i + 1], z = o[i + 2]
    const y1 = y * cx - z * sx // roll about X
    const z1 = y * sx + z * cx
    o[i] = x * cz - y1 * sz // pitch about Z
    o[i + 1] = x * sz + y1 * cz
    o[i + 2] = z1
  }
}

export function shipwreck(n = 6000): Float32Array {
  const o: number[] = []
  const L = 6.5 // half-length
  const beam = 1.3 // half-width
  const hullH = 2.2

  // ── Hull shell — tapered at bow & stern, U cross-section, open deck ───────
  const hullN = Math.floor(n * 0.52)
  for (let i = 0; i < hullN; i++) {
    const u = rnd() * 2 - 1 // along length (-stern .. +bow)
    const taper = Math.pow(Math.max(0, 1 - u * u), 0.42)
    const s = rnd() * 2 - 1 // across (-port .. +starboard)
    const w = beam * taper
    const sheer = Math.pow(Math.abs(u), 2.0) * 0.7 // deck rises toward the ends
    o.push(u * L, Math.pow(Math.abs(s), 1.4) * hullH + sheer * Math.pow(Math.abs(s), 0.5), s * w)
  }

  // keel ridge
  for (let i = 0; i < n * 0.05; i++) {
    const u = rnd() * 2 - 1
    o.push(u * L, 0.0, (rnd() - 0.5) * 0.1)
  }

  // gunwale rim along the top edges (the deck line)
  for (let i = 0; i < n * 0.12; i++) {
    const u = rnd() * 2 - 1
    const taper = Math.pow(Math.max(0, 1 - u * u), 0.42)
    const side = rnd() < 0.5 ? 1 : -1
    o.push(u * L, hullH + Math.pow(Math.abs(u), 2.0) * 0.7, side * beam * taper)
  }

  // a few deck planks across the intact stern half
  for (let i = 0; i < n * 0.06; i++) {
    const u = -rnd() * 0.8
    const taper = Math.pow(Math.max(0, 1 - u * u), 0.42)
    o.push(u * L, hullH * 0.95, (rnd() * 2 - 1) * beam * taper)
  }

  // ── Tall main mast near midships ──────────────────────────────────────────
  for (let i = 0; i < n * 0.12; i++) {
    const t = rnd()
    o.push(0.6 + (rnd() - 0.5) * 0.17, hullH + t * 5.4, (rnd() - 0.5) * 0.17)
  }
  // main yardarm (large)
  for (let i = 0; i < n * 0.055; i++) {
    o.push(0.6 + (rnd() - 0.5) * 0.13, hullH + 3.4, (rnd() * 2 - 1) * 2.0)
  }
  // upper yardarm
  for (let i = 0; i < n * 0.035; i++) {
    o.push(0.6 + (rnd() - 0.5) * 0.11, hullH + 4.7, (rnd() * 2 - 1) * 1.2)
  }
  // tattered rigging hanging from the yardarm
  for (let i = 0; i < n * 0.02; i++) {
    const side = rnd() < 0.5 ? 1 : -1
    o.push(0.6 + (rnd() - 0.5) * 0.1, hullH + 3.4 - rnd() * 2.5, side * (1.6 + (rnd() - 0.5) * 0.3))
  }

  // ── Fallen mast lying across the deck, broken off ─────────────────────────
  for (let i = 0; i < n * 0.08; i++) {
    const t = rnd()
    o.push(-1.2 - t * 3.6 + (rnd() - 0.5) * 0.1, hullH + 0.25 + (rnd() - 0.5) * 0.1, -0.4 + t * 1.4 + (rnd() - 0.5) * 0.12)
  }

  // ── Bowsprit jutting from the bow ─────────────────────────────────────────
  for (let i = 0; i < n * 0.03; i++) {
    const t = rnd()
    o.push(L + t * 1.6, hullH * 0.4 + t * 0.5, (rnd() - 0.5) * 0.06)
  }

  // encrusting marine growth over the hull
  for (let i = 0; i < n * 0.04; i++) {
    const u = rnd() * 2 - 1
    const taper = Math.pow(Math.max(0, 1 - u * u), 0.42)
    o.push(u * L, rnd() * hullH, (rnd() * 2 - 1) * beam * taper)
  }

  // settle the wreck: list to port + slight bow-up pitch
  rotateAll(o, -0.26, 0.05)
  return f32(o)
}

export function submarine(n = 6000): Float32Array {
  const o: number[] = []
  const L = 7 // half-length
  const R = 1.05 // hull radius

  // ── Cigar hull — cylindrical shell, rounded/tapered ends ─────────────────
  const hullN = Math.floor(n * 0.6)
  for (let i = 0; i < hullN; i++) {
    const u = rnd() * 2 - 1
    const prof = Math.sqrt(Math.max(0, 1 - Math.pow(u, 8))) // straight body, rounded tips
    const r = R * prof
    const a = rnd() * TAU
    o.push(u * L, R + Math.cos(a) * r, Math.sin(a) * r)
  }

  // ── Conning tower (sail) amidships, slightly forward ─────────────────────
  for (let i = 0; i < n * 0.12; i++) {
    o.push(0.6 + (rnd() - 0.5) * 1.8, 2 * R + rnd() * 1.3, (rnd() - 0.5) * 0.7)
  }
  // periscope / mast
  for (let i = 0; i < n * 0.03; i++) {
    const t = rnd()
    o.push(1.1 + (rnd() - 0.5) * 0.08, 2 * R + 1.3 + t * 0.9, (rnd() - 0.5) * 0.08)
  }
  // diving planes on the sail
  for (let i = 0; i < n * 0.03; i++) {
    o.push(0.6 + (rnd() - 0.5) * 0.6, 2 * R + 0.7, (rnd() * 2 - 1) * 1.3)
  }

  // ── Stern: cruciform dive planes + propeller ──────────────────────────────
  for (let i = 0; i < n * 0.05; i++) {
    const s = rnd() * 2 - 1
    if (rnd() < 0.5) o.push(-L - rnd() * 0.4, R + s * 1.4, (rnd() - 0.5) * 0.12) // vertical fin
    else o.push(-L - rnd() * 0.4, R + (rnd() - 0.5) * 0.12, s * 1.4) // horizontal fin
  }
  for (let i = 0; i < n * 0.04; i++) {
    const a = rnd() * TAU
    const rr = rnd() * 0.6
    o.push(-L - 0.45, R + Math.cos(a) * rr, Math.sin(a) * rr) // propeller disc
  }

  // encrusting growth + hull breach speckles
  for (let i = 0; i < n * 0.05; i++) {
    const u = rnd() * 2 - 1
    const prof = Math.sqrt(Math.max(0, 1 - Math.pow(u, 8)))
    const a = rnd() * TAU
    o.push(u * L, R + Math.cos(a) * R * prof, Math.sin(a) * R * prof)
  }

  // settle with a gentle list
  rotateAll(o, -0.2, 0.03)
  return f32(o)
}

export function helmet(n = 1800): Float32Array {
  const o: number[] = []
  shell(o, Math.floor(n * 0.55), 0, 0.7, 0, 0.6) // brass dome
  cyl(o, Math.floor(n * 0.2), 0, 0, 0, 0.5, 0.35) // collar
  ring(o, Math.floor(n * 0.15), 0, 0.7, 0.55, 0.22, 0.05, 'xy') // face window
  // bolts around the window
  for (let i = 0; i < n * 0.1; i++) {
    const a = rnd() * TAU
    o.push(Math.cos(a) * 0.3, 0.7 + Math.sin(a) * 0.3, 0.56)
  }
  return f32(o)
}

export function signalDevice(n = 1500): Float32Array {
  const o: number[] = []
  shell(o, Math.floor(n * 0.3), 0, 1.0, 0, 0.35) // core
  ring(o, Math.floor(n * 0.25), 0, 1.0, 0, 0.8, 0.04, 'xy') // orbiting ring
  ring(o, Math.floor(n * 0.2), 0, 1.0, 0, 0.95, 0.04, 'xz') // second ring (unnatural)
  cyl(o, Math.floor(n * 0.12), 0, 0, 0, 0.1, 1.0) // stem
  // sharp spikes — clearly artificial
  for (let i = 0; i < n * 0.13; i++) {
    const a = (i / (n * 0.13)) * TAU
    const t = rnd()
    o.push(Math.cos(a) * (0.35 + t * 0.6), 1.0 + Math.sin(a) * (0.35 + t * 0.6), 0)
  }
  return f32(o)
}
