import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { EnvRef } from '../../lib/env'

// Full-screen ocean atmosphere. A fixed clip-space quad behind everything that
// renders, continuously from one shader:
//   • a depth-driven vertical water-colour transition
//     (turquoise → ocean blue → deep blue → navy → near-black)
//   • an above-water horizon with sky + haze at the very start
//   • sun god-rays / light shafts that fade out with depth
//   • light always coming from above, dimming gradually into total dark
//
// Rendered first (renderOrder -10, depthTest/Write off) so the additive
// particle layers blend on top of it.

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0); // fill clip space, ignore camera
  }
`

const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uDepth;   // 0 surface → 1 challenger deep (scroll)
  uniform float uLight;   // ambient light from above, 1 → 0
  uniform float uAspect;

  // Water colour stops by depth
  const vec3 cSurface = vec3(0.18, 0.52, 0.55); // light cyan / turquoise
  const vec3 cShallow = vec3(0.06, 0.30, 0.48); // ocean blue
  const vec3 cMid     = vec3(0.02, 0.13, 0.30); // deep blue
  const vec3 cNavy    = vec3(0.008, 0.045, 0.13); // navy
  const vec3 cHadal   = vec3(0.002, 0.008, 0.02); // nearly black

  vec3 depthColor(float d) {
    vec3 c = cSurface;
    c = mix(c, cShallow, smoothstep(0.00, 0.18, d));
    c = mix(c, cMid,     smoothstep(0.16, 0.40, d));
    c = mix(c, cNavy,    smoothstep(0.40, 0.64, d));
    c = mix(c, cHadal,   smoothstep(0.64, 0.92, d));
    return c;
  }

  // Sun shafts streaming from above, with a slight tilt and slow shimmer
  float godRays(vec2 uv, float t) {
    float x = uv.x + (1.0 - uv.y) * 0.22;
    float r = sin(x * 26.0 + sin(t * 0.25) * 1.5) * 0.5 + 0.5;
    r *= sin(x * 9.0 - t * 0.12 + 1.7) * 0.5 + 0.5;
    r = pow(r, 3.5);
    r *= smoothstep(0.05, 0.95, uv.y); // strongest near the surface above
    return r;
  }

  void main() {
    vec2 uv = vUv;
    float d = clamp(uDepth, 0.0, 1.0);

    vec3 water = depthColor(d);

    // Vertical light gradient — brighter toward the top (light from above)
    float vert = pow(clamp(uv.y, 0.0, 1.0), 1.25);
    vec3 col = water * mix(0.40, 1.15, vert);

    // Ambient glow from above, stronger in the shallows
    col += water * smoothstep(0.45, 1.0, uv.y) * uLight * 0.5;

    // God rays — only while sunlight still reaches this depth
    float shallow = clamp(1.0 - d * 2.2, 0.0, 1.0);
    float gr = godRays(uv, uTime) * uLight * shallow;
    col += vec3(0.55, 0.82, 0.88) * gr * 0.35;

    // ── Surface & horizon (only at the very start of the descent) ──────────
    float surfAmt = clamp(1.0 - d / 0.05, 0.0, 1.0);    // fades by ~0.05 scroll
    float surfProg = clamp(d / 0.05, 0.0, 1.0);
    if (surfAmt > 0.001) {
      float horizon = mix(0.54, 1.18, surfProg);        // rises and exits the top

      // sky above the horizon, hazier toward the line
      vec3 sky = mix(vec3(0.82, 0.89, 0.91), vec3(0.42, 0.62, 0.74), smoothstep(horizon, 1.0, uv.y));

      // gentle wave distortion of the boundary
      float wave = sin(uv.x * 26.0 + uTime * 0.8) * 0.004 + sin(uv.x * 60.0 - uTime * 1.3) * 0.0015;
      float hy = horizon + wave;

      // bright haze band right at the waterline
      float band = smoothstep(0.05, 0.0, abs(uv.y - hy));
      sky += vec3(0.9, 0.95, 0.96) * band * 0.5;

      // sky reflection + specular just below the surface
      float refl = smoothstep(hy, hy - 0.16, uv.y) * step(uv.y, hy);
      vec3 reflCol = mix(col, vec3(0.55, 0.74, 0.80), 0.5);
      col = mix(col, reflCol, refl * 0.55);
      float spec = smoothstep(0.0015, 0.0, abs(uv.y - (hy - 0.02 - abs(sin(uv.x * 40.0 + uTime)) * 0.01)));
      col += vec3(0.9) * spec * 0.25 * (1.0 - refl * 0.0);

      // composite sky above the line
      float aboveMask = smoothstep(hy - 0.003, hy + 0.003, uv.y);
      col = mix(col, mix(col, sky, aboveMask), surfAmt);
    }

    // Soft instrument vignette
    float vig = smoothstep(1.35, 0.35, length((uv - 0.5) * vec2(uAspect, 1.0)));
    col *= mix(0.72, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`

export default function OceanBackdrop({ envRef }: { envRef: EnvRef }) {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDepth: { value: 0 },
      uLight: { value: 1 },
      uAspect: { value: 1 },
    }),
    [],
  )

  useFrame(({ clock, size }) => {
    if (!matRef.current) return
    const env = envRef.current
    const u = matRef.current.uniforms
    u.uTime.value = clock.getElapsedTime()
    u.uDepth.value = env.scroll
    u.uLight.value = env.light
    u.uAspect.value = size.width / size.height
  })

  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
