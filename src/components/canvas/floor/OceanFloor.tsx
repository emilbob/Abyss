import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMousePosition } from '../../../hooks/useMousePosition'
import type { EnvRef } from '../../../lib/env'

export const FLOOR_Y = -6.5

// The seabed. A large horizontal plane that follows the camera, shaded with
// noise dunes + sediment ripples + fine sand grain, lit only by faint ambient
// blue and the vehicle's forward exploration light. The cursor stirs the sand:
// a brushed, sediment-kicking patch follows the mouse so you can swipe it.

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform vec2  uCamPos;    // camera x,z
  uniform vec2  uAhead;     // offset to the exploration-light pool
  uniform vec2  uTouch;     // cursor projected onto the floor (world x,z)
  uniform float uTouchStr;  // 0..1 cursor active on the floor
  uniform float uSize;
  uniform float uOpacity;
  uniform float uTime;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1, 0)), c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, amp = 0.5;
    for (int i = 0; i < 4; i++) { v += amp * vnoise(p); p *= 2.0; amp *= 0.5; }
    return v;
  }

  void main() {
    vec2 world = (vUv - 0.5) * uSize + uCamPos;

    // dunes + fine sediment ripples + high-freq sand grain
    float dune = fbm(world * 0.04);
    float ripple = sin(world.x * 1.3 + dune * 4.0) * 0.5 + 0.5;
    ripple *= sin(world.y * 1.0 - dune * 3.0) * 0.5 + 0.5;
    float grain = vnoise(world * 7.0) * 0.5 + vnoise(world * 23.0) * 0.5;
    float relief = dune * 0.6 + ripple * 0.3 + grain * 0.16;

    // warmer, sandier palette
    vec3 sand = vec3(0.30, 0.25, 0.17);
    vec3 cool = vec3(0.03, 0.09, 0.15);
    vec3 base = mix(cool, sand, 0.3 + relief * 0.7);

    // exploration light — a soft pool ahead of the vehicle
    vec2 lightC = uCamPos + uAhead;
    float ld = length(world - lightC);
    float explore = exp(-ld * ld * 0.0016);

    float ambient = 0.12;
    vec3 col = base * (ambient + explore * 1.25);
    col += vec3(0.18, 0.42, 0.52) * explore * 0.3; // bluish wash from the lamp

    // ── Cursor swipe — stir up sediment where the mouse brushes the sand ──────
    float td = length(world - uTouch);
    float touch = smoothstep(7.5, 0.0, td) * uTouchStr * uOpacity;
    float swirl = sin(td * 3.5 - uTime * 5.0) * 0.5 + 0.5;
    float fineStir = vnoise(world * 4.0 + uTime * 0.6); // churned grain
    // freshly brushed sand brightens, with stirred ripples
    col += vec3(0.55, 0.46, 0.32) * touch * (0.5 + swirl * 0.5 + fineStir * 0.4);
    // kicked-up sediment haze (cooler, drifting)
    col += vec3(0.20, 0.42, 0.48) * touch * 0.7;

    // distance fog from the camera
    float fd = length(world - uCamPos);
    float fog = smoothstep(120.0, 8.0, fd);

    col *= fog;
    gl_FragColor = vec4(col, uOpacity * fog);
  }
`

const SIZE = 460

export default function OceanFloor({ envRef }: { envRef: EnvRef }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const mouse = useMousePosition()

  const ray = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_Y), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCamPos: { value: new THREE.Vector2(0, 0) },
      uAhead: { value: new THREE.Vector2(0, -26) },
      uTouch: { value: new THREE.Vector2(0, -26) },
      uTouchStr: { value: 0 },
      uSize: { value: SIZE },
      uOpacity: { value: 0 },
    }),
    [],
  )

  useFrame(({ clock, camera }) => {
    if (!matRef.current || !meshRef.current) return
    const env = envRef.current
    const u = matRef.current.uniforms
    u.uTime.value = clock.getElapsedTime()
    u.uOpacity.value = env.floor * env.reveal
    ;(u.uCamPos.value as THREE.Vector2).set(camera.position.x, camera.position.z)
    meshRef.current.position.set(camera.position.x, FLOOR_Y, camera.position.z)

    // Project the cursor onto the seabed for the swipe interaction
    ndc.set(mouse.current.x, mouse.current.y)
    ray.setFromCamera(ndc, camera)
    const target = u.uTouch.value as THREE.Vector2
    let active = 0
    if (ray.ray.intersectPlane(plane, hit)) {
      const dist = Math.hypot(hit.x - camera.position.x, hit.z - camera.position.z)
      if (dist < 70) {
        target.set(hit.x, hit.z)
        active = 1
      }
    }
    u.uTouchStr.value += (active - u.uTouchStr.value) * 0.12
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-5} frustumCulled={false}>
      <planeGeometry args={[SIZE, SIZE, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
