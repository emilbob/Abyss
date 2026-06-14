import { useMemo } from 'react'
import OceanFloor, { FLOOR_Y } from '../canvas/floor/OceanFloor'
import SandParticles from '../canvas/floor/SandParticles'
import FloorObject from '../canvas/floor/FloorObject'
import ParticleCreature from '../canvas/creatures/ParticleCreature'
import { chest, bottle, messageScroll, anchor, shipwreck, helmet, signalDevice, submarine } from '../canvas/floor/floorShapes'
import { whale } from '../canvas/creatures/shapes'
import type { EnvRef } from '../../lib/env'

// 11034 M — The Ocean Floor. After the long fall, ground at last. The camera
// levels out and travels forward, discovering relics that emerge from the fog.
export default function Zone6Floor({ envRef }: { envRef: EnvRef }) {
  const sChest = useMemo(() => chest(6000), [])
  const sBottle = useMemo(() => bottle(1600), [])
  const sMessage = useMemo(() => messageScroll(700), [])
  const sAnchor = useMemo(() => anchor(3400), [])
  const sWreck = useMemo(() => shipwreck(10000), [])
  const sHelmet = useMemo(() => helmet(2000), [])
  const sSignal = useMemo(() => signalDevice(1700), [])
  const sSub = useMemo(() => submarine(12000), [])
  const echoWhale = useMemo(() => whale(6000), [])

  const y = FLOOR_Y + 0.1

  return (
    <>
      <OceanFloor envRef={envRef} />
      <SandParticles envRef={envRef} />

      {/* Discoveries along the forward path — emerge from fog one by one */}
      <FloorObject envRef={envRef} shape={sChest} position={[-3, y, -30]} scale={1.7} rotationY={0.5}
        color="#cda978" glow={1.3} name="Sunken Chest" sci="circa 1700s" />
      {/* Message in a bottle — glass shell + the parchment sealed inside */}
      <FloorObject envRef={envRef} shape={sBottle} position={[4, y, -58]} scale={1.2} rotationY={1.0}
        color="#a9d6cf" glow={0.6} />
      <FloorObject envRef={envRef} shape={sMessage} position={[4, y, -58]} scale={1.2} rotationY={1.0}
        color="#d8c08a" glow={1.15} name="Message In A Bottle" sci="text illegible" labelY={3.0} />
      <FloorObject envRef={envRef} shape={sSub} position={[6, y, -78]} scale={1.0} rotationY={-0.6}
        color="#8fa6ac" name="Sunken Submarine" sci="hull number lost" labelY={5.5} />
      <FloorObject envRef={envRef} shape={sAnchor} position={[-5, y, -94]} scale={1.7} rotationY={-0.4}
        color="#8fb0b8" name="Ancient Anchor" sci="admiralty pattern" labelY={7.5} />
      <FloorObject envRef={envRef} shape={sWreck} position={[2, y, -130]} scale={1.15} rotationY={0.5}
        color="#a89478" name="Shipwreck" sci="origin unknown" labelY={9.5} />
      <FloorObject envRef={envRef} shape={sHelmet} position={[-3, y, -162]} scale={1.3} rotationY={0.8}
        color="#c8a86e" name="Diving Helmet" sci="Mark V · brass" />
      <FloorObject envRef={envRef} shape={sSignal} position={[2, y, -196]} scale={1.3} rotationY={0.0}
        color="#4ad9ff" glow={1.3} pulse name="Signal Device" sci="— anomalous —" labelY={3.6} />

      {/* A final, distant whale echo passing high overhead at the very end */}
      <ParticleCreature
        envRef={envRef}
        shape={echoWhale}
        color="#bcd6dc"
        scale={2.0}
        from={[-70, FLOOR_Y + 34, -150]}
        to={[70, FLOOR_Y + 40, -210]}
        appearAt={0.9}
        vanishAt={1.0}
        crossSeconds={46}
        bob={0.4}
        glow={0.45}
        wag={0.28}
        swimSpeed={0.5}
        pointSize={0.9}
      />
    </>
  )
}
