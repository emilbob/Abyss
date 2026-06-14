import { useMemo } from 'react'
import ParticleCreature from '../canvas/creatures/ParticleCreature'
import SurfaceLight from '../canvas/SurfaceLight'
import { whale } from '../canvas/creatures/shapes'
import type { EnvRef } from '../../lib/env'

// 0 m — The Surface. Warm light, gentle drift, a vast blue whale crossing
// slowly into the dark, a distant humpback deeper down.
export default function Zone0Surface({ envRef }: { envRef: EnvRef }) {
  const blueWhale = useMemo(() => whale(28000), [])
  const humpback = useMemo(() => whale(14000), [])

  return (
    <>
      <SurfaceLight envRef={envRef} />

      {/* Blue whale — enormous, unhurried, ~30s to cross */}
      <ParticleCreature
        envRef={envRef}
        shape={blueWhale}
        color="#cfe6ea"
        scale={2.4}
        name="Blue Whale"
        sci="Balaenoptera musculus"
        labelY={5.2}
        from={[-34, 5, -26]}
        to={[36, 1, -32]}
        appearAt={0.0}
        vanishAt={0.13}
        crossSeconds={32}
        bob={0.5}
        glow={0.32}
        wag={0.3}
        swimSpeed={0.55}
        pointSize={1.0}
      />

      {/* Distant humpback, deeper and slower still */}
      <ParticleCreature
        envRef={envRef}
        shape={humpback}
        color="#bcd6dc"
        scale={1.5}
        name="Humpback Whale"
        sci="Megaptera novaeangliae"
        from={[34, -6, -48]}
        to={[-32, -10, -52]}
        appearAt={0.0}
        vanishAt={0.11}
        crossSeconds={36}
        bob={0.4}
        glow={0.38}
        wag={0.28}
        swimSpeed={0.5}
        pointSize={0.95}
      />
    </>
  )
}
