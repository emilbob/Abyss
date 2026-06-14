import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMousePosition } from '../../../hooks/useMousePosition'
import { FLOOR_Y } from './OceanFloor'
import type { EnvRef } from '../../../lib/env'

// The seabed as particles. A world-anchored grain field that wraps around the
// camera (so the ground streams past during forward travel) and is kicked up
// where the cursor sweeps across it — sand you can manipulate on mouse move.

const HALF = 58

const vertexShader = /* glsl */ `
  attribute float aRand;
  varying float vRand;
  varying float vLift;
  varying float vFog;
  varying float vExplore;

  uniform vec2  uCam;       // camera x,z
  uniform float uHalf;
  uniform float uFloorY;
  uniform vec2  uTouch;     // cursor projected onto the floor (world x,z)
  uniform float uTouchStr;
  uniform float uTime;

  void main() {
    vRand = aRand;
    vec3 p = position;
    float R = uHalf;

    // wrap the grain into the tile centred on the camera → infinite ground
    float wx = mod(p.x - uCam.x + R, 2.0 * R) - R;
    float wz = mod(p.z - uCam.y + R, 2.0 * R) - R;
    vec3 world = vec3(uCam.x + wx, uFloorY + p.y, uCam.y + wz);

    // faint settling drift
    world.x += sin(uTime * 0.3 + aRand * 6.28) * 0.04;

    // ── Mouse manipulation — kick up the sand near the cursor ────────────────
    float d = distance(world.xz, uTouch);
    float lift = smoothstep(7.0, 0.0, d) * uTouchStr;
    vLift = lift;
    if (lift > 0.0) {
      vec2 dir = normalize(world.xz - uTouch + 0.0001);
      world.y += lift * (1.1 + aRand * 1.6);
      world.xz += dir * lift * (0.7 + aRand * 1.1);
    }

    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    float dist = -mv.z;
    vFog = smoothstep(110.0, 6.0, dist);

    // exploration-light pool ahead of the vehicle
    vec2 lightC = uCam + vec2(0.0, -26.0);
    float ld = distance(world.xz, lightC);
    vExplore = exp(-ld * ld * 0.0016);

    gl_PointSize = clamp((0.6 + aRand * 0.9) * (200.0 / dist), 0.0, 2.6);
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  varying float vRand;
  varying float vLift;
  varying float vFog;
  varying float vExplore;
  uniform float uOpacity;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float dd = length(c);
    if (dd > 0.5) discard;
    float a = 1.0 - smoothstep(0.1, 0.5, dd);

    vec3 sand = mix(vec3(0.20, 0.16, 0.11), vec3(0.46, 0.38, 0.25), vRand);
    float bright = 0.16 + vExplore * 1.0 + vLift * 0.9;
    vec3 col = sand * bright;
    col += vec3(0.18, 0.40, 0.45) * vLift * 0.7; // kicked-up sediment glow

    gl_FragColor = vec4(col, a * vFog * uOpacity);
  }
`

export default function SandParticles({ envRef, count = 60000 }: { envRef: EnvRef; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const mouse = useMousePosition()

  const ray = useMemo(() => new THREE.Raycaster(), [])
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR_Y), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])

  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const rand = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2 * HALF
      pos[i * 3 + 1] = Math.random() * 0.35 // slight unevenness
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2 * HALF
      rand[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))
    return geo
  }, [count])

  const uniforms = useMemo(
    () => ({
      uCam: { value: new THREE.Vector2(0, 0) },
      uHalf: { value: HALF },
      uFloorY: { value: FLOOR_Y },
      uTouch: { value: new THREE.Vector2(0, -26) },
      uTouchStr: { value: 0 },
      uTime: { value: 0 },
      uOpacity: { value: 0 },
    }),
    [],
  )

  useFrame(({ clock, camera }) => {
    if (!matRef.current || !pointsRef.current) return
    const env = envRef.current
    const u = matRef.current.uniforms
    u.uTime.value = clock.getElapsedTime()
    u.uOpacity.value = env.floor * env.reveal
    ;(u.uCam.value as THREE.Vector2).set(camera.position.x, camera.position.z)

    const visible = env.floor > 0.01
    if (pointsRef.current.visible !== visible) pointsRef.current.visible = visible

    // project cursor onto the seabed
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
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  )
}
