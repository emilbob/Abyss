import { useMemo } from 'react'
import ParticleCreature from '../canvas/creatures/ParticleCreature'
import { anglerfish, siphonophore, smallFish, squid } from '../canvas/creatures/shapes'
import type { EnvRef } from '../../lib/env'

// 1000 m — Midnight Zone. Almost total darkness; only bioluminescence remains.
// Lanternfish, anglerfish, squid, siphonophores — their light is their own.
export default function Zone2Midnight({ envRef }: { envRef: EnvRef }) {
  const lantern1 = useMemo(() => smallFish(1500), [])
  const lantern2 = useMemo(() => smallFish(1400), [])
  const angler = useMemo(() => anglerfish(9000), [])
  const sq = useMemo(() => squid(9000), [])
  const sipho = useMemo(() => siphonophore(9000), [])

  return (
    <>
      {/* Lanternfish — small, sharp blue-green glints */}
      <ParticleCreature
        envRef={envRef}
        shape={lantern1}
        name="Lanternfish"
        sci="Myctophidae"
        labelY={1.6}
        color="#6effd8"
        scale={1.4}
        from={[-16, 6, -10]}
        to={[18, 2, -12]}
        appearAt={0.21}
        vanishAt={0.33}
        crossSeconds={20}
        glow={1.6}
        wag={0.5}
        swimSpeed={3.2}
        pointSize={1.15}
      />
      <ParticleCreature
        envRef={envRef}
        shape={lantern2}
        name="Lanternfish"
        sci="Myctophidae"
        labelY={1.5}
        color="#4ad9ff"
        scale={1.2}
        from={[16, -5, -9]}
        to={[-18, -2, -11]}
        appearAt={0.22}
        vanishAt={0.33}
        crossSeconds={22}
        glow={1.5}
        wag={0.5}
        swimSpeed={3.0}
        pointSize={1.15}
      />

      {/* Anglerfish — bulbous body, the lure leading in the dark */}
      <ParticleCreature
        envRef={envRef}
        shape={angler}
        name="Anglerfish"
        sci="Melanocetus johnsonii"
        color="#7af0e0"
        scale={1.7}
        from={[-18, 2, -9]}
        to={[16, -3, -11]}
        appearAt={0.24}
        vanishAt={0.33}
        crossSeconds={28}
        glow={1.4}
        wag={0.3}
        swimSpeed={1.6}
        pointSize={1.15}
      />

      {/* Squid jetting through */}
      <ParticleCreature
        envRef={envRef}
        shape={sq}
        name="Humboldt Squid"
        sci="Dosidicus gigas"
        color="#8fe0ff"
        scale={1.5}
        from={[20, 5, -13]}
        to={[-20, -4, -15]}
        appearAt={0.26}
        vanishAt={0.335}
        crossSeconds={24}
        glow={1.2}
        wag={0.6}
        swimSpeed={2.2}
        pointSize={1.15}
      />

      {/* Siphonophore — a long, slow, glittering chain */}
      <ParticleCreature
        envRef={envRef}
        shape={sipho}
        name="Siphonophore"
        sci="Praya dubia"
        color="#6effd8"
        scale={1.3}
        from={[-22, -8, -16]}
        to={[22, 8, -18]}
        appearAt={0.215}
        vanishAt={0.33}
        crossSeconds={40}
        glow={1.1}
        wag={0.25}
        swimSpeed={0.9}
        pointSize={1.15}
      />
    </>
  )
}
