import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clamp01 } from '../../lib/env'
import type { EnvRef } from '../../lib/env'

// Sparse motes that flicker to life only in the deep, dark zones — the living
// glow of the midnight/abyssal water. Each spark pulses on its own clock, so
// the field shimmers like distant organisms catching the light.

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aRand;
  attribute float aPeriod;
  varying float vGlow;
  varying vec3  vColor;

  uniform float uTime;
  uniform float uActive;
  uniform vec3  uColorA;
  uniform vec3  uColorB;

  void main() {
    vColor = mix(uColorA, uColorB, aRand);

    // Per-mote pulse — sharp flash, slow decay
    float ph = fract(uTime / aPeriod + aRand);
    float flash = smoothstep(0.0, 0.04, ph) * (1.0 - smoothstep(0.04, 0.5, ph));
    vGlow = flash * uActive;

    vec3 pos = position;
    pos.y += sin(uTime * 0.2 + aRand * 6.28) * 0.4;
    pos.x += cos(uTime * 0.15 + aRand * 6.28) * 0.4;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = clamp(aSize * (260.0 / -mvPos.z) * (0.4 + vGlow), 0.0, 26.0);
    gl_Position = projectionMatrix * mvPos;
  }
`

const fragmentShader = /* glsl */ `
  varying float vGlow;
  varying vec3  vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = 1.0 - smoothstep(0.0, 0.15, d);
    float halo = 1.0 - smoothstep(0.1, 0.5, d);
    float a = core * 0.95 + halo * 0.5;
    gl_FragColor = vec4(vColor, clamp(a * vGlow, 0.0, 1.0));
  }
`

interface BioluminescenceProps {
  envRef: EnvRef
  count?: number
}

export default function Bioluminescence({ envRef, count = 1100 }: BioluminescenceProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const pointsRef = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const rand = new Float32Array(count)
    const period = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const z = -3 - Math.pow(Math.random(), 1.4) * 45
      positions[i * 3] = (Math.random() - 0.5) * (50 + -z)
      positions[i * 3 + 1] = (Math.random() - 0.5) * 70
      positions[i * 3 + 2] = z
      sizes[i] = 1.2 + Math.random() * 2.6
      rand[i] = Math.random()
      period[i] = 2.5 + Math.random() * 7
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))
    geo.setAttribute('aPeriod', new THREE.BufferAttribute(period, 1))
    return geo
  }, [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uActive: { value: 0 },
      uColorA: { value: new THREE.Color('#6effd8') },
      uColorB: { value: new THREE.Color('#4ad9ff') },
    }),
    [],
  )

  useFrame(({ clock, camera }) => {
    if (!matRef.current) return
    const env = envRef.current
    if (pointsRef.current) pointsRef.current.position.set(camera.position.x, camera.position.y, camera.position.z)
    matRef.current.uniforms.uTime.value = clock.getElapsedTime()
    // Active from the midnight zone (z3) down; fades a little at the dead bottom
    const active = clamp01(env.zone[2] + env.zone[3] + env.zone[4]) * (1 - env.stillness * 0.55)
    matRef.current.uniforms.uActive.value = active * env.reveal
  })

  return (
    <points ref={pointsRef} geometry={geometry}>
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
  )
}
