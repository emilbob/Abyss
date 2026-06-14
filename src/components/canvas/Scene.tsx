import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { gsap } from 'gsap'
import { createEnv, clamp01, ss01 } from '../../lib/env'
import type { AbyssEnv } from '../../lib/env'
import OceanBackdrop from './OceanBackdrop'
import MarineSnow from './MarineSnow'
import Bioluminescence from './Bioluminescence'
import CameraRig from './CameraRig'
import Effects from './Effects'
import Zone0Surface from '../zones/Zone0Surface'
import Zone1Twilight from '../zones/Zone1Twilight'
import Zone2Midnight from '../zones/Zone2Midnight'
import Zone3Abyssal from '../zones/Zone3Abyssal'
import Zone4Hadal from '../zones/Zone4Hadal'
import Zone5Challenger from '../zones/Zone5Challenger'
import Zone6Floor from '../zones/Zone6Floor'

interface SceneProps {
  scrollRef: React.MutableRefObject<number>
  velRef: React.MutableRefObject<number>
  startRef: React.MutableRefObject<(() => void) | null>
  isMobile: boolean
}

// Zone band starts (matches lib/zones.ts) and their lengths
const BANDS: [number, number][] = [
  [0.0, 0.1],
  [0.1, 0.11],
  [0.21, 0.12],
  [0.33, 0.12],
  [0.45, 0.1],
  [0.55, 0.09],
  [0.64, 0.2],
]

export default function Scene({ scrollRef, velRef, startRef, isMobile }: SceneProps) {
  // One shared, mutable env object — wrapped in a stable ref-like holder
  const env = useMemo<AbyssEnv>(() => createEnv(), [])
  const envRef = useMemo(() => ({ current: env }), [env])
  const revealHolder = useMemo(() => ({ current: 0 }), [])

  useFrame(() => {
    const s = scrollRef.current
    const e = envRef.current
    e.scroll = s
    // Smooth the velocity toward the live reading
    e.vel += (Math.min(Math.abs(velRef.current), 1.2) - e.vel) * 0.1
    e.reveal = revealHolder.current

    e.light = clamp01(1 - s * 2.3)
    e.density = 0.35 + ss01(s / 0.78) * 0.65
    e.stillness = ss01((s - 0.55) / 0.09) // vertical motion freezes after challenger

    // Ocean-floor chapter
    e.floor = ss01((s - 0.62) / 0.1)
    e.level = ss01((s - 0.57) / 0.11)
    e.travel = clamp01((s - 0.66) / 0.34)

    for (let i = 0; i < 7; i++) {
      e.zone[i] = ss01((s - BANDS[i][0]) / BANDS[i][1])
    }
  })

  useEffect(() => {
    let tl: gsap.core.Timeline | null = null
    startRef.current = () => {
      tl = gsap.timeline()
      tl.to(revealHolder, { current: 1, duration: 3.0, ease: 'power2.inOut' })
    }
    return () => {
      tl?.kill()
    }
  }, [startRef, revealHolder])

  return (
    <>
      <color attach="background" args={['#010305']} />

      <OceanBackdrop envRef={envRef} />
      <MarineSnow envRef={envRef} count={isMobile ? 9000 : 18000} />
      <Bioluminescence envRef={envRef} count={isMobile ? 600 : 1100} />

      <Zone0Surface envRef={envRef} />
      <Zone1Twilight envRef={envRef} />
      <Zone2Midnight envRef={envRef} />
      <Zone3Abyssal envRef={envRef} />
      <Zone4Hadal envRef={envRef} />
      <Zone5Challenger envRef={envRef} />
      <Zone6Floor envRef={envRef} />

      <CameraRig envRef={envRef} />
      <Effects />
    </>
  )
}
