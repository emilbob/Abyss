import { useMemo } from 'react'
import ParticleCreature from '../canvas/creatures/ParticleCreature'
import SignalCluster from '../canvas/SignalCluster'
import { hadalShape } from '../canvas/creatures/shapes'
import type { EnvRef } from '../../lib/env'

// 6000 m — Hadal Zone. Maximum particle density, near-zero visibility. The
// first mysterious transmissions. A rare silhouette, never fully revealed.
export default function Zone4Hadal({ envRef }: { envRef: EnvRef }) {
  const fragment = useMemo(() => hadalShape(24000), [])

  return (
    <>
      {/* Faint bioluminescent signals — small pulses, unknown origin */}
      <SignalCluster envRef={envRef} position={[-9, 4, -16]} appearAt={0.45} vanishAt={0.55} color="#3fd0c8" size={5} />
      <SignalCluster envRef={envRef} position={[11, -6, -20]} appearAt={0.47} vanishAt={0.55} color="#4ad9ff" size={6} />
      <SignalCluster envRef={envRef} position={[2, 9, -26]} appearAt={0.49} vanishAt={0.55} color="#6effd8" size={4} />

      {/* A vast unknown silhouette — only ~22% ever surfaces from the black */}
      <ParticleCreature
        envRef={envRef}
        shape={fragment}
        name="Unidentified"
        sci="species unknown"
        labelY={6}
        color="#5fb8c0"
        scale={3.4}
        from={[-40, -4, -50]}
        to={[34, 2, -56]}
        appearAt={0.46}
        vanishAt={0.55}
        crossSeconds={46}
        bob={0.5}
        reveal={0.22}
        glow={0.8}
        wag={0.35}
        swimSpeed={0.6}
        pointSize={1.15}
      />
    </>
  )
}
