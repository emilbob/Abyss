import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { EnvRef } from '../../../lib/env'

// A relic resting on the seabed. It does not move — instead it emerges from the
// fog as the camera travels toward it, then dissolves once passed. Discovery
// through limited visibility, never a sudden pop-in.

const vertexShader = /* glsl */ `
  attribute float aRand;
  varying float vRand;
  varying float vFog;

  uniform float uTime;
  uniform float uScale;
  uniform float uPointSize;

  void main() {
    vRand = aRand;
    vec3 pos = position * uScale;
    // faint current sway
    pos.x += sin(uTime * 0.4 + aRand * 6.28) * 0.03;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    float dist = -mvPos.z;
    // emerge from fog far ahead → clear up close → gone once behind
    vFog = smoothstep(70.0, 16.0, dist) * smoothstep(0.5, 6.0, dist);

    gl_PointSize = clamp(uPointSize * uScale * (190.0 / dist), 0.0, 4.5);
    gl_Position = projectionMatrix * mvPos;
  }
`

const fragmentShader = /* glsl */ `
  varying float vRand;
  varying float vFog;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uPulse;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = 1.0 - smoothstep(0.0, 0.2, d);
    float halo = 1.0 - smoothstep(0.1, 0.5, d);
    float a = (core * 0.9 + halo * 0.45) * uGlow * uPulse;
    gl_FragColor = vec4(uColor, clamp(a * vFog * uOpacity, 0.0, 1.0));
  }
`

interface FloorObjectProps {
  envRef: EnvRef
  shape: Float32Array
  position: [number, number, number]
  scale?: number
  color?: string
  glow?: number
  rotationY?: number
  pulse?: boolean
  pointSize?: number
  name?: string
  sci?: string
  labelY?: number
}

export default function FloorObject({
  envRef,
  shape,
  position,
  scale = 1,
  color = '#9fc3c9',
  glow = 1,
  rotationY = 0,
  pulse = false,
  pointSize = 1.0,
  name,
  sci,
  labelY,
}: FloorObjectProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const groupRef = useRef<THREE.Group>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const labelHeight = labelY ?? scale * 2.2

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
      uPointSize: { value: pointSize },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0 },
      uGlow: { value: glow },
      uPulse: { value: 1 },
    }),
    [],
  )

  useFrame(({ clock }) => {
    if (!matRef.current) return
    const env = envRef.current
    const t = clock.getElapsedTime()
    const u = matRef.current.uniforms
    u.uTime.value = t
    // present only during the ocean-floor chapter
    const op = env.floor * env.reveal
    u.uOpacity.value = op
    u.uPulse.value = pulse ? 0.55 + 0.45 * Math.pow(Math.max(0, Math.sin(t * 1.6)), 4.0) : 1
    if (labelRef.current) labelRef.current.style.opacity = String(op * 0.7)
  })

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
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
