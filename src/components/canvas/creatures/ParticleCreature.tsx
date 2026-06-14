import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { clamp01, smoothstep } from '../../../lib/env'
import type { EnvRef } from '../../../lib/env'
import { useMousePosition } from '../../../hooks/useMousePosition'

const vertexShader = /* glsl */ `
  attribute float aRand;
  varying float vRand;
  varying float vFade;

  uniform float uTime;
  uniform float uScale;
  uniform float uWag;
  uniform float uSwimSpeed;
  uniform float uPointSize;
  uniform float uFlip;
  uniform vec2  uMouse;       // cursor in NDC (-1..1)
  uniform float uAspect;      // viewport width / height
  uniform float uMouseRadius; // influence radius in NDC
  uniform float uMouseForce;  // push strength

  // cheap hash for per-point scatter direction
  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    vRand = aRand;

    vec3 pos = position;
    pos.x *= uFlip;

    // Swimming undulation — amplitude grows toward the tail (-x)
    float tail = smoothstep(1.0, -1.5, pos.x);
    float wag = sin(pos.x * 0.9 - uTime * uSwimSpeed) * uWag * tail;
    pos.z += wag;
    pos.y += wag * 0.3;

    pos *= uScale;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);

    // ── Mouse manipulation ────────────────────────────────────────────────
    // Project the point to screen, measure distance to the cursor, and shove
    // the particle away — the creature's body parts and swirls under the mouse.
    vec4 clip = projectionMatrix * mvPos;
    vec2 ndc = clip.xy / clip.w;
    vec2 diff = ndc - uMouse;
    diff.x *= uAspect;
    float dist = length(diff);
    float infl = smoothstep(uMouseRadius, 0.0, dist);
    if (infl > 0.0) {
      vec2 dir = dist > 1e-4 ? normalize(vec2((ndc.x - uMouse.x) * uAspect, ndc.y - uMouse.y)) : vec2(0.0);
      // per-point swirl so it scatters rather than rigidly translating
      float ang = hash(aRand * 91.7) * 6.2831;
      dir += 0.6 * vec2(cos(ang), sin(ang));
      float push = infl * uMouseForce * (-mvPos.z);
      mvPos.xy += dir * push * 0.06;
      mvPos.z += infl * uMouseForce * (0.4 + 0.6 * hash(aRand * 13.3));
    }

    // Fade points by camera distance — body dissolves into the dark
    vFade = clamp(1.0 - (-mvPos.z - 4.0) / 60.0, 0.0, 1.0);

    gl_PointSize = clamp(uPointSize * uScale * (180.0 / -mvPos.z), 0.0, 4.0);
    gl_Position = projectionMatrix * mvPos;
  }
`

const fragmentShader = /* glsl */ `
  varying float vRand;
  varying float vFade;

  uniform vec3  uColor;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uReveal;   // fraction of points shown (fragments for giants)

  void main() {
    if (vRand > uReveal) discard;

    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float core = 1.0 - smoothstep(0.0, 0.2, d);
    float glow = 1.0 - smoothstep(0.1, 0.5, d);
    float alpha = (core * 0.9 + glow * 0.45) * uGlow;

    gl_FragColor = vec4(uColor, clamp(alpha * uOpacity * vFade, 0.0, 1.0));
  }
`

export interface ParticleCreatureProps {
  envRef: EnvRef
  shape: Float32Array
  color: string
  scale?: number
  /** Scroll window the creature is visible across. */
  appearAt: number
  vanishAt: number
  /** Swim path endpoints in world space. */
  from: [number, number, number]
  to: [number, number, number]
  /** Seconds to cross the scene (slow & majestic — 18–30s). */
  crossSeconds?: number
  /** Vertical bob amplitude. */
  bob?: number
  /** Fraction of points shown — < 1 reveals only fragments (giants). */
  reveal?: number
  glow?: number
  wag?: number
  swimSpeed?: number
  pointSize?: number
  /** Subtle floating label shown above the creature. */
  name?: string
  /** Faint Latin name beneath it. */
  sci?: string
  /** Height of the label above the creature centre (defaults from scale). */
  labelY?: number
}

export default function ParticleCreature({
  envRef,
  shape,
  color,
  scale = 1,
  appearAt,
  vanishAt,
  from,
  to,
  crossSeconds = 24,
  bob = 0.6,
  reveal = 1,
  glow = 1,
  wag = 0.35,
  swimSpeed = 1.4,
  pointSize = 0.7,
  name,
  sci,
  labelY,
}: ParticleCreatureProps) {
  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const mouse = useMousePosition()
  const flip = to[0] < from[0] ? -1 : 1
  const labelHeight = labelY ?? scale * 1.7

  const geometry = useMemo(() => {
    const count = shape.length / 3
    const rand = new Float32Array(count)
    for (let i = 0; i < count; i++) rand[i] = Math.random()
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(shape, 3))
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))
    return geo
  }, [shape])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScale: { value: scale },
      uWag: { value: wag },
      uSwimSpeed: { value: swimSpeed },
      uPointSize: { value: pointSize },
      uFlip: { value: flip },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0 },
      uGlow: { value: glow },
      uReveal: { value: reveal },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uAspect: { value: 1 },
      uMouseRadius: { value: 0.32 },
      uMouseForce: { value: 0 },
    }),
    [],
  )

  const win = Math.max(0.0001, vanishAt - appearAt)
  const fadeFrac = 0.24

  useFrame(({ clock, size }) => {
    if (!matRef.current || !groupRef.current) return
    const env = envRef.current
    const t = clock.getElapsedTime()
    const u = matRef.current.uniforms
    u.uTime.value = t

    // Smooth the cursor + keep aspect current; force ramps with the reveal
    const m = u.uMouse.value as THREE.Vector2
    m.x += (mouse.current.x - m.x) * 0.12
    m.y += (mouse.current.y - m.y) * 0.12
    u.uAspect.value = size.width / size.height

    // Visibility envelope across the scroll window
    const s = env.scroll
    const op =
      smoothstep(clamp01((s - appearAt) / (win * fadeFrac))) *
      (1 - smoothstep(clamp01((s - (vanishAt - win * fadeFrac)) / (win * fadeFrac))))
    u.uOpacity.value = op
    // Disturbance only while the creature is actually present
    u.uMouseForce.value = op * 1.0

    // Subtle label fades with the creature
    if (labelRef.current) labelRef.current.style.opacity = String(op * 0.7)

    // Cull the whole draw call while the creature is off-screen — keeps the
    // denser, finer-grained creatures cheap.
    const visible = op > 0.002
    if (groupRef.current.visible !== visible) groupRef.current.visible = visible
    if (!visible) return

    // Swim across the path, looping; slows to a crawl in the still deep
    const speedMul = 1 - env.stillness * 0.85
    const p = (t / crossSeconds) * speedMul
    const sp = p - Math.floor(p)
    const g = groupRef.current
    g.position.x = from[0] + (to[0] - from[0]) * sp
    g.position.y = from[1] + (to[1] - from[1]) * sp + Math.sin(t * 0.4) * bob
    g.position.z = from[2] + (to[2] - from[2]) * sp
  })

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {name && (
        <Html position={[0, labelHeight, 0]} center zIndexRange={[8, 0]} wrapperClass="creature-label">
          <div ref={labelRef} style={{ opacity: 0, textAlign: 'center', whiteSpace: 'nowrap', userSelect: 'none', pointerEvents: 'none' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.58rem',
                letterSpacing: '0.3em',
                color: 'var(--star-white)',
                textTransform: 'uppercase',
                paddingLeft: '0.3em',
              }}
            >
              {name}
            </div>
            {sci && (
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: '0.72rem',
                  letterSpacing: '0.04em',
                  color: 'var(--mute-blue)',
                  marginTop: '0.1rem',
                }}
              >
                {sci}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}
