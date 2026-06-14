import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ZONES } from '../../lib/zones'

interface ZoneLabelProps {
  zone: number // 1..6
  delay?: number
}

export default function ZoneLabel({ zone, delay = 0 }: ZoneLabelProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLDivElement>(null)
  const depthRef = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)

  const z = ZONES[zone - 1]

  useEffect(() => {
    const els = [numRef.current, nameRef.current, depthRef.current]
    if (els.some((e) => !e)) return

    if (!mounted.current) {
      mounted.current = true
      gsap.fromTo(els, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.4, delay, stagger: 0.08, ease: 'power3.out' })
      return
    }

    // Fade-swap on zone change
    const tl = gsap.timeline()
    tl.to(els, { opacity: 0, y: -10, duration: 0.45, ease: 'power2.in' })
      .add(() => {
        if (numRef.current) numRef.current.textContent = `0${z.id} / VII`
        if (nameRef.current) nameRef.current.textContent = z.name
        if (depthRef.current) depthRef.current.textContent = `DEPTH ${z.depth}`
      })
      .fromTo(els, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out' })
  }, [zone, z, delay])

  return (
    <div
      ref={wrapRef}
      style={{ position: 'fixed', top: '2.4rem', left: '2.4rem', pointerEvents: 'none', userSelect: 'none' }}
    >
      <div
        ref={numRef}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          letterSpacing: '0.34em',
          color: 'var(--signal)',
          marginBottom: '0.7rem',
        }}
      >
        0{z.id} / VII
      </div>
      <div
        ref={nameRef}
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: 'clamp(1.6rem, 3.4vw, 2.8rem)',
          letterSpacing: '0.14em',
          color: 'var(--star-white)',
          lineHeight: 1,
        }}
      >
        {z.name}
      </div>
      <div
        ref={depthRef}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          letterSpacing: '0.28em',
          color: 'var(--mute-blue)',
          marginTop: '0.8rem',
        }}
      >
        DEPTH {z.depth}
      </div>
    </div>
  )
}
