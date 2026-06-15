import { useRef, useEffect, useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import Lenis from 'lenis'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { gsap } from 'gsap'
import Scene from './components/canvas/Scene'
import CustomCursor from './components/ui/CustomCursor'
import LoadingScreen from './components/ui/LoadingScreen'
import HeroText from './components/ui/HeroText'
import ZoneLabel from './components/ui/ZoneLabel'
import ScrollIndicator from './components/ui/ScrollIndicator'
import DepthHUD from './components/ui/DepthHUD'
import SignalReadout from './components/ui/SignalReadout'
import Telemetry from './components/ui/Telemetry'
import ReturnToSurface from './components/ui/ReturnToSurface'
import EndMessage from './components/ui/EndMessage'

const isMobile = window.innerWidth < 768
const isTouch = window.matchMedia('(pointer: coarse)').matches

const ZONE_BOUNDS = [0.1, 0.21, 0.33, 0.45, 0.55, 0.64]
function zoneFor(s: number) {
  let z = 1
  for (const b of ZONE_BOUNDS) if (s >= b) z++
  return z
}

// ── Ambient ocean music ──────────────────────────────────────────────────────
// Module-level singleton so it survives StrictMode's double-mount. Autoplay is
// gated behind the DESCEND click (a user gesture), satisfying browser policy.
const MUSIC_VOLUME = 0.55
const ambience = new Audio('/natureseye-ocean-currents-meditation-161684.mp3')
ambience.loop = true
ambience.volume = 0
let ambienceStarted = false

function startAmbience() {
  if (ambienceStarted) return
  ambienceStarted = true
  ambience
    .play()
    .then(() => {
      gsap.to(ambience, { volume: MUSIC_VOLUME, duration: 6, ease: 'power2.out' })
    })
    .catch(() => {
      ambienceStarted = false
    })
}

export default function App() {
  const scrollRef = useRef(0)
  const velRef = useRef(0)
  const sceneStartRef = useRef<(() => void) | null>(null)
  const lenisRef = useRef<Lenis | null>(null)
  const lastZone = useRef(1)
  const lastBelow = useRef(false)

  const [uiReady, setUiReady] = useState(false)
  const [zone, setZone] = useState(1)
  const [muted, setMuted] = useState(false)
  const [belowSurface, setBelowSurface] = useState(false)
  const [atEnd, setAtEnd] = useState(false)
  const lastEnd = useRef(false)

  const heroDelayRef = useRef(0)
  const zoneDelayRef = useRef(0)
  const scrollDelayRef = useRef(0)

  useEffect(() => {
    // Always start at the surface — browsers restore scroll on reload otherwise
    window.scrollTo(0, 0)
    const lenis = new Lenis({ lerp: isTouch ? 0.18 : 0.07, smoothWheel: true })
    lenisRef.current = lenis
    lenis.scrollTo(0, { immediate: true })

    const raf = (time: number) => lenis.raf(time * 1000)
    lenis.on('scroll', (e: { velocity: number }) => {
      velRef.current = e.velocity * 0.02
    })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        scrollRef.current = self.progress
        const z = zoneFor(self.progress)
        if (z !== lastZone.current) {
          lastZone.current = z
          setZone(z)
        }
        const below = self.progress > 0.02
        if (below !== lastBelow.current) {
          lastBelow.current = below
          setBelowSurface(below)
        }
        const end = self.progress > 0.9
        if (end !== lastEnd.current) {
          lastEnd.current = end
          setAtEnd(end)
        }
      },
    })

    return () => {
      lenis.destroy()
      lenisRef.current = null
      gsap.ticker.remove(raf)
    }
  }, [])

  // Velocity decays back to zero when the wheel stops
  useEffect(() => {
    let raf = 0
    const decay = () => {
      velRef.current *= 0.9
      raf = requestAnimationFrame(decay)
    }
    raf = requestAnimationFrame(decay)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleLoadingComplete = useCallback(() => {
    // Guarantee we enter at the surface (reload may have restored scroll)
    window.scrollTo(0, 0)
    lenisRef.current?.scrollTo(0, { immediate: true })
    sceneStartRef.current?.()
    zoneDelayRef.current = 1.6
    heroDelayRef.current = 2.2
    scrollDelayRef.current = 4.5
    startAmbience()
    setUiReady(true)
  }, [])

  const returnToSurface = useCallback(() => {
    lenisRef.current?.scrollTo(0, { duration: 3.0 })
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      ambience.muted = !m
      return !m
    })
  }, [])

  return (
    <>
      {/* Three.js canvas */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: isTouch ? 'none' : 'auto' }}>
        <Canvas
          style={{ width: '100%', height: '100%' }}
          camera={{ position: [0, 0, 6], fov: 60, near: 0.1, far: 2000 }}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          dpr={[1, isMobile ? 1 : 1.5]}
        >
          <Scene scrollRef={scrollRef} velRef={velRef} startRef={sceneStartRef} isMobile={isMobile} />
        </Canvas>
      </div>

      {/* HTML overlay */}
      {uiReady && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
          <ZoneLabel zone={zone} delay={zoneDelayRef.current} />
          <HeroText delay={heroDelayRef.current} hide={zone >= 2} />
          <ScrollIndicator
            delay={scrollDelayRef.current}
            hide={atEnd}
            label={zone >= 7 ? 'Explore' : 'Descend'}
          />
          <DepthHUD scrollRef={scrollRef} velRef={velRef} />
          <SignalReadout zone={zone} />
          <Telemetry />
          <ReturnToSurface visible={belowSurface} onClick={returnToSurface} />
          <EndMessage scrollRef={scrollRef} />
          <button
            onClick={toggleMute}
            data-cursor
            style={{
              position: 'fixed',
              top: 'var(--pad)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'none',
              pointerEvents: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              letterSpacing: '0.34em',
              color: muted ? 'rgba(159,180,189,0.45)' : 'var(--signal)',
              textTransform: 'uppercase',
            }}
          >
            {muted ? '◌ SOUND OFF' : '◉ SOUND ON'}
          </button>
        </div>
      )}

      <LoadingScreen onComplete={handleLoadingComplete} />

      {/* 3200vh — six depth zones + the ocean-floor exploration */}
      <div style={{ height: '3200vh' }} aria-hidden />

      <CustomCursor />
    </>
  )
}
