import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clamp01, smoothstep } from '../../lib/env'
import type { EnvRef } from '../../lib/env'

// A discovered signal: a tight pulsing particle cluster wrapped in expanding,
// slightly distorted sonar rings. Ancient. Unknown. Not necessarily human.

const ringVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ringFrag = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3  uColor;

  void main() {
    vec2 uv = vUv - 0.5;
    float ang = atan(uv.y, uv.x);
    float dist = length(uv) * 2.0;
    // distortion — the ring is not quite circular
    dist += sin(ang * 5.0 + uTime * 0.6) * 0.03;
    if (dist > 1.0) discard;

    float t = uTime * 0.16;
    float r1 = fract(dist - t);
    float r2 = fract(dist - t + 0.4);
    float rings = smoothstep(0.9, 1.0, r1) + smoothstep(0.93, 1.0, r2) * 0.5;
    rings *= smoothstep(1.0, 0.05, dist);

    float core = exp(-dist * 16.0) * 2.6;
    float total = (rings + core) * uOpacity;
    gl_FragColor = vec4(uColor, clamp(total, 0.0, 1.0));
  }
`

const clusterVert = /* glsl */ `
  attribute float aRand;
  varying float vG;
  uniform float uTime;
  void main() {
    float ph = fract(uTime * 0.5 + aRand);
    vG = 0.4 + 0.6 * (smoothstep(0.0, 0.1, ph) * (1.0 - smoothstep(0.1, 0.6, ph)));
    vec3 pos = position;
    pos *= 0.85 + 0.15 * sin(uTime * 1.5 + aRand * 6.28);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = clamp((6.0 * aRand + 2.0) * (200.0 / -mv.z) * vG, 0.0, 22.0);
    gl_Position = projectionMatrix * mv;
  }
`

const clusterFrag = /* glsl */ `
  varying float vG;
  uniform float uOpacity;
  uniform vec3  uColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = (1.0 - smoothstep(0.0, 0.5, d)) * vG;
    gl_FragColor = vec4(uColor, clamp(a * uOpacity, 0.0, 1.0));
  }
`

interface SignalClusterProps {
  envRef: EnvRef
  position: [number, number, number]
  appearAt: number
  vanishAt: number
  color?: string
  size?: number
}

export default function SignalCluster({
  envRef,
  position,
  appearAt,
  vanishAt,
  color = '#3fd0c8',
  size = 6,
}: SignalClusterProps) {
  const ringMat = useRef<THREE.ShaderMaterial>(null)
  const clusterMat = useRef<THREE.ShaderMaterial>(null)
  const col = useMemo(() => new THREE.Color(color), [color])

  const clusterGeo = useMemo(() => {
    const n = 80
    const pos = new Float32Array(n * 3)
    const rand = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const r = Math.cbrt(Math.random()) * 0.7
      const a = Math.random() * Math.PI * 2
      const v = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = Math.sin(v) * Math.cos(a) * r
      pos[i * 3 + 1] = Math.sin(v) * Math.sin(a) * r
      pos[i * 3 + 2] = Math.cos(v) * r
      rand[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))
    return g
  }, [])

  const ringU = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: col } }), [col])
  const clusterU = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: col } }), [col])

  const win = Math.max(0.0001, vanishAt - appearAt)

  useFrame(({ clock }) => {
    const env = envRef.current
    const t = clock.getElapsedTime()
    const s = env.scroll
    const op =
      smoothstep(clamp01((s - appearAt) / (win * 0.3))) *
      (1 - smoothstep(clamp01((s - (vanishAt - win * 0.3)) / (win * 0.3)))) *
      env.reveal
    if (ringMat.current) {
      ringMat.current.uniforms.uTime.value = t
      ringMat.current.uniforms.uOpacity.value = op
    }
    if (clusterMat.current) {
      clusterMat.current.uniforms.uTime.value = t
      clusterMat.current.uniforms.uOpacity.value = op
    }
  })

  return (
    <group position={position}>
      <points geometry={clusterGeo}>
        <shaderMaterial
          ref={clusterMat}
          vertexShader={clusterVert}
          fragmentShader={clusterFrag}
          uniforms={clusterU}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <mesh>
        <planeGeometry args={[size, size]} />
        <shaderMaterial
          ref={ringMat}
          vertexShader={ringVert}
          fragmentShader={ringFrag}
          uniforms={ringU}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
