import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useMousePosition } from '../../hooks/useMousePosition'
import type { EnvRef } from '../../lib/env'

// ── The primary visual language: ocean matter ────────────────────────────────
// Plankton, marine snow, sediment, microscopic organisms. An effectively
// infinite vertical field — particles wrap, so the descent never runs out of
// ocean. Near particles stream faster than far ones (parallax / depth layers).

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aBright;
  attribute float aDepthN;   // 0 = far background, 1 = near foreground
  attribute float aRand;

  varying float vBright;
  varying float vRand;

  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uReveal;
  uniform float uScrollDist;  // accumulates with descent
  uniform float uVel;         // scroll velocity magnitude
  uniform float uDensity;     // fraction of particles alive
  uniform float uStillness;   // 1 = motion frozen (challenger deep)
  uniform float uTileH;

  void main() {
    vBright = aBright;
    vRand = aRand;

    vec3 pos = position;

    // Near particles stream faster — creates depth layering as we descend
    float speed = mix(0.35, 1.9, aDepthN);

    // Constant marine-snow fall + descent stream + a velocity kick
    float flow = (uScrollDist * speed)
               + uTime * 0.45 * speed * (1.0 - uStillness * 0.9)
               + uVel * 6.0 * speed;

    float H = uTileH;
    float y = pos.y - flow;
    y = mod(y + H, 2.0 * H) - H;   // wrap into [-H, H]
    pos.y = y;

    // Gentle horizontal sway — the water is alive
    pos.x += sin(uTime * 0.3 + aRand * 6.28) * 0.25 * (1.0 - uStillness);

    // Depth-aware mouse parallax — near matter shifts more
    pos.x += uMouse.x * aDepthN * 1.6;
    pos.y += uMouse.y * aDepthN * 1.0;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    float pSize = aSize * (300.0 / -mvPos.z);

    // Density culls particles by shrinking them to nothing
    float alive = step(aRand, uDensity);
    pSize *= alive * uReveal;

    // Slight velocity streak — faster scroll = longer specks
    pSize *= 1.0 + uVel * 1.5 * aDepthN;

    gl_PointSize = clamp(pSize, 0.0, 40.0);
    gl_Position = projectionMatrix * mvPos;
  }
`

const fragmentShader = /* glsl */ `
  varying float vBright;
  varying float vRand;

  uniform float uTime;
  uniform float uLight;    // ambient light level (1 surface → 0 deep)
  uniform vec3  uTintLit;  // colour when lit
  uniform vec3  uTintDeep; // colour in the dark
  uniform float uDepth01;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float core = 1.0 - smoothstep(0.0, 0.18, d);
    float glow = 1.0 - smoothstep(0.1, 0.5, d);
    float alpha = core * 0.85 + glow * 0.4;

    // Marine snow always catches a little light; sunlit near the surface
    float lum = 0.06 + uLight * 0.4;

    // Faint slow shimmer per particle
    float shimmer = 0.85 + 0.15 * sin(uTime * 1.2 + vRand * 30.0);

    vec3 color = mix(uTintDeep, uTintLit, uLight);

    gl_FragColor = vec4(color, clamp(alpha * vBright * lum * shimmer, 0.0, 1.0));
  }
`

function buildGeometry(count: number, tileH: number) {
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const brights = new Float32Array(count)
  const depthN = new Float32Array(count)
  const rand = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    // z controls the depth layer; spread across a deep slab in front of camera
    const z = -2 - Math.pow(Math.random(), 1.5) * 60
    const spreadX = 40 + (-z) * 0.9
    const spreadY = tileH

    positions[i * 3] = (Math.random() - 0.5) * spreadX * 2
    positions[i * 3 + 1] = (Math.random() - 0.5) * spreadY * 2
    positions[i * 3 + 2] = z

    depthN[i] = THREE.MathUtils.clamp((z + 62) / 60, 0, 1) // 1 = near
    sizes[i] = 0.4 + Math.pow(Math.random(), 2.5) * 2.4
    brights[i] = Math.pow(Math.random(), 1.6) * 0.85 + 0.15
    rand[i] = Math.random()
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geo.setAttribute('aBright', new THREE.BufferAttribute(brights, 1))
  geo.setAttribute('aDepthN', new THREE.BufferAttribute(depthN, 1))
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))
  return geo
}

interface MarineSnowProps {
  envRef: EnvRef
  count?: number
}

export default function MarineSnow({ envRef, count = 18000 }: MarineSnowProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const mouse = useMousePosition()
  const tileH = 90

  const geometry = useMemo(() => buildGeometry(count, tileH), [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uReveal: { value: 0 },
      uScrollDist: { value: 0 },
      uVel: { value: 0 },
      uDensity: { value: 0.35 },
      uStillness: { value: 0 },
      uLight: { value: 1 },
      uDepth01: { value: 0 },
      uTileH: { value: tileH },
      uTintLit: { value: new THREE.Color('#dfeef0') },
      uTintDeep: { value: new THREE.Color('#3fd0c8') },
    }),
    [],
  )

  useFrame(({ clock, camera }) => {
    if (!matRef.current) return
    const env = envRef.current
    // Follow the camera so the field always surrounds it (esp. forward travel)
    if (pointsRef.current) pointsRef.current.position.set(camera.position.x, camera.position.y, camera.position.z)
    const u = matRef.current.uniforms
    u.uTime.value = clock.getElapsedTime()
    u.uReveal.value = env.reveal
    u.uScrollDist.value = env.scroll * 700
    u.uVel.value = env.vel
    u.uDensity.value = env.density
    u.uStillness.value = env.stillness
    u.uLight.value = env.light
    u.uDepth01.value = env.scroll

    const m = u.uMouse.value as THREE.Vector2
    m.x += (mouse.current.x - m.x) * 0.04
    m.y += (mouse.current.y - m.y) * 0.04
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
