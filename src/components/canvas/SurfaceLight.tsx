import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { EnvRef } from '../../lib/env'

// Warm sunlight + soft caustics from the surface above. Bright at 0 m, gone by
// the time the twilight zone takes hold. A large plane catching dancing light.

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const frag = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpacity;

  float caustic(vec2 p, float t) {
    float c = 0.0;
    for (int n = 1; n <= 3; n++) {
      float fn = float(n);
      c += sin(p.x * fn * 2.4 + t * 0.6) * cos(p.y * fn * 2.4 - t * 0.5);
    }
    return c / 3.0;
  }

  void main() {
    vec2 p = (vUv - 0.5) * 6.0;
    float c = caustic(p, uTime);
    float light = smoothstep(0.1, 0.9, c * 0.5 + 0.5);

    // brighter toward the top (toward the surface)
    float grad = smoothstep(0.0, 1.0, vUv.y);
    light *= grad;

    // soft radial vignette so it melts into the void at the edges
    float vig = smoothstep(1.0, 0.2, length(vUv - 0.5) * 1.6);

    vec3 warm = vec3(0.85, 0.92, 0.95);
    gl_FragColor = vec4(warm, light * vig * uOpacity * 0.5);
  }
`

interface SurfaceLightProps {
  envRef: EnvRef
}

export default function SurfaceLight({ envRef }: SurfaceLightProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0 } }), [])

  useFrame(({ clock }) => {
    if (!matRef.current) return
    const env = envRef.current
    matRef.current.uniforms.uTime.value = clock.getElapsedTime()
    // Present only at the surface — fades out into the twilight
    matRef.current.uniforms.uOpacity.value = (1 - env.zone[1]) * env.light * env.reveal
  })

  return (
    <mesh position={[0, 14, -24]} rotation={[-0.5, 0, 0]}>
      <planeGeometry args={[90, 70]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
