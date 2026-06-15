import { useFrame } from '@react-three/fiber'
import { useMousePosition } from '../../hooks/useMousePosition'
import { lerp } from '../../lib/env'
import type { EnvRef } from '../../lib/env'

interface CameraRigProps {
  envRef: EnvRef
}

const FORWARD = 210 // forward travel distance across the ocean floor

/**
 * Two camera modes blended by `env.level`:
 *   • Descent (level 0) — near-static, gentle drift + depth pull-back; the fall
 *     is carried by the marine snow streaming past.
 *   • Floor (level 1) — the rig levels out, tilts down toward the seabed and
 *     travels forward, like a submersible levelling after a long dive.
 */
export default function CameraRig({ envRef }: CameraRigProps) {
  const mouse = useMousePosition()

  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime()
    const env = envRef.current
    const z = env.zone
    const level = env.level
    const travel = env.travel
    const still = env.stillness

    // ── Descent target ──────────────────────────────────────────────────────
    const mouseW = Math.max(0, 1 - z[3] * 0.45 - z[4] * 0.35) * (1 - still * 0.8)
    const driftX = Math.sin(t * 0.05) * 0.08 * (1 - still)
    const driftY = Math.cos(t * 0.04) * 0.05 * (1 - still)
    const dX = driftX + mouse.current.x * 0.22 * mouseW
    const dY = driftY + mouse.current.y * 0.14 * mouseW
    const dZ = 6 + z[3] * 2.6 - z[5] * 0.8
    const dRX = -mouse.current.y * 0.06 * mouseW + Math.sin(t * 0.06) * 0.004
    const dRY = -mouse.current.x * 0.08 * mouseW + Math.cos(t * 0.05) * 0.004
    const dRZ = Math.sin(t * 0.03) * 0.006 * (1 - still)

    // ── Floor target — levelled, looking down, travelling forward ────────────
    const fX = Math.sin(t * 0.05) * 0.25 + mouse.current.x * 0.5
    const fY = -1.0 + Math.sin(t * 0.07) * 0.18
    const fZ = 6 - travel * FORWARD
    const fRX = -0.24 + mouse.current.y * 0.04
    const fRY = mouse.current.x * 0.05 + Math.sin(t * 0.04) * 0.01
    const fRZ = Math.sin(t * 0.035) * 0.004

    // ── Blend ────────────────────────────────────────────────────────────────
    const tx = lerp(dX, fX, level)
    const ty = lerp(dY, fY, level)
    const tz = lerp(dZ, fZ, level)
    const trx = lerp(dRX, fRX, level)
    const tryw = lerp(dRY, fRY, level)
    const trz = lerp(dRZ, fRZ, level)

    // Lerp gets snappier on the floor so forward travel keeps up with scroll
    const lp = lerp(0.028 - still * 0.018, 0.06, level)

    camera.position.x += (tx - camera.position.x) * lp
    camera.position.y += (ty - camera.position.y) * lp
    camera.position.z += (tz - camera.position.z) * lp

    camera.rotation.x += (trx - camera.rotation.x) * (lp + 0.004)
    camera.rotation.y += (tryw - camera.rotation.y) * (lp + 0.004)
    camera.rotation.z += (trz - camera.rotation.z) * lp
  })

  return null
}
