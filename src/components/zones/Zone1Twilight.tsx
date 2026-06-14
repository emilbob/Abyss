import { useMemo } from 'react'
import ParticleCreature from '../canvas/creatures/ParticleCreature'
import { fishSchool, jellyfish, smallFish } from '../canvas/creatures/shapes'
import type { EnvRef } from '../../lib/env'

// 200 m — Twilight Zone. Colour drains away. Schools of fish, drifting
// jellyfish, rising particle density.
export default function Zone1Twilight({ envRef }: { envRef: EnvRef }) {
  const school = useMemo(() => fishSchool(120, 80), [])
  const jelly1 = useMemo(() => jellyfish(8000), [])
  const jelly2 = useMemo(() => jellyfish(6000), [])
  const tuna = useMemo(() => smallFish(2600), [])

  return (
    <>
      {/* Shimmering school sweeping across */}
      <ParticleCreature
        envRef={envRef}
        shape={school}
        name="Schooling Fish"
        sci="Clupeidae"
        labelY={3.4}
        color="#9fc7c4"
        scale={1.0}
        from={[-28, 4, -16]}
        to={[32, -3, -20]}
        appearAt={0.1}
        vanishAt={0.21}
        crossSeconds={24}
        bob={0.3}
        glow={0.8}
        wag={0.5}
        swimSpeed={3.0}
        pointSize={1.15}
      />

      {/* Jellyfish drifting upward past the camera */}
      <ParticleCreature
        envRef={envRef}
        shape={jelly1}
        name="Moon Jellyfish"
        sci="Aurelia aurita"
        color="#bfe9e6"
        scale={1.7}
        from={[10, -12, -7]}
        to={[6, 13, -9]}
        appearAt={0.11}
        vanishAt={0.205}
        crossSeconds={30}
        bob={0.2}
        glow={1.1}
        wag={0.18}
        swimSpeed={0.8}
        pointSize={1.15}
      />
      <ParticleCreature
        envRef={envRef}
        shape={jelly2}
        name="Moon Jellyfish"
        sci="Aurelia aurita"
        color="#a9dfe6"
        scale={1.2}
        from={[-12, -14, -12]}
        to={[-9, 12, -14]}
        appearAt={0.12}
        vanishAt={0.21}
        crossSeconds={34}
        bob={0.2}
        glow={1.0}
        wag={0.16}
        swimSpeed={0.7}
        pointSize={1.15}
      />

      {/* A lone tuna cutting through */}
      <ParticleCreature
        envRef={envRef}
        shape={tuna}
        name="Bluefin Tuna"
        sci="Thunnus thynnus"
        color="#aec9cf"
        scale={2.0}
        from={[30, -2, -14]}
        to={[-30, 3, -18]}
        appearAt={0.13}
        vanishAt={0.2}
        crossSeconds={18}
        bob={0.4}
        glow={0.8}
        wag={0.45}
        swimSpeed={3.5}
        pointSize={1.15}
      />
    </>
  )
}
