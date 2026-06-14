import { useMemo } from 'react'
import ParticleCreature from '../canvas/creatures/ParticleCreature'
import { giantIsopod, giantSquid, gulperEel } from '../canvas/creatures/shapes'
import type { EnvRef } from '../../lib/env'

// 4000 m — Abyssal Zone. The world becomes vast and the camera tiny. Giants
// emerge from the dark; most of their bodies stay hidden — only fragments.
export default function Zone3Abyssal({ envRef }: { envRef: EnvRef }) {
  const gSquid = useMemo(() => giantSquid(30000), [])
  const eel = useMemo(() => gulperEel(18000), [])
  const isopod = useMemo(() => giantIsopod(13000), [])

  return (
    <>
      {/* Giant squid — colossal, only ~35% of points ever revealed */}
      <ParticleCreature
        envRef={envRef}
        shape={gSquid}
        name="Giant Squid"
        sci="Architeuthis dux"
        labelY={5.5}
        color="#9fd6e0"
        scale={3.0}
        from={[-44, 6, -42]}
        to={[34, -8, -48]}
        appearAt={0.33}
        vanishAt={0.45}
        crossSeconds={40}
        bob={0.6}
        reveal={0.38}
        glow={1.0}
        wag={0.4}
        swimSpeed={0.8}
        pointSize={1.15}
      />

      {/* Gulper eel — vast mouth, whip of a body, half hidden */}
      <ParticleCreature
        envRef={envRef}
        shape={eel}
        name="Gulper Eel"
        sci="Eurypharynx pelecanoides"
        color="#8fcdd6"
        scale={2.4}
        from={[36, -4, -38]}
        to={[-34, 4, -44]}
        appearAt={0.36}
        vanishAt={0.45}
        crossSeconds={38}
        bob={0.5}
        reveal={0.5}
        glow={0.95}
        wag={0.7}
        swimSpeed={1.1}
        pointSize={1.15}
      />

      {/* Giant isopod drifting low, mostly in shadow */}
      <ParticleCreature
        envRef={envRef}
        shape={isopod}
        name="Giant Isopod"
        sci="Bathynomus giganteus"
        color="#a7c3c9"
        scale={1.8}
        from={[-22, -12, -22]}
        to={[20, -10, -26]}
        appearAt={0.345}
        vanishAt={0.445}
        crossSeconds={34}
        bob={0.3}
        reveal={0.72}
        glow={0.85}
        wag={0.15}
        swimSpeed={0.7}
        pointSize={1.15}
      />
    </>
  )
}
