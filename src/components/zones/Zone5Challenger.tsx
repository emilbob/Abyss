import SignalCluster from '../canvas/SignalCluster'
import type { EnvRef } from '../../lib/env'

// 11000 m — Challenger Deep. Near-total darkness and silence. No life.
// Particles barely move. Only one distant, lonely pulse from the dark.
export default function Zone5Challenger({ envRef }: { envRef: EnvRef }) {
  return (
    <>
      <SignalCluster
        envRef={envRef}
        position={[0, 0, -40]}
        appearAt={0.55}
        vanishAt={0.64}
        color="#3fd0c8"
        size={7}
      />
    </>
  )
}
