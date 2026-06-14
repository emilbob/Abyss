import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

const STATUS = [
  'INITIALIZING SUBMERSIBLE',
  'FLOODING BALLAST TANKS',
  'CALIBRATING SONAR ARRAY',
  'PRESSURE HULL NOMINAL',
  'DESCENT SYSTEMS READY',
]

interface LoadingScreenProps {
  onComplete: () => void
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const arcRef = useRef<SVGCircleElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const enterRef = useRef<HTMLButtonElement>(null)
  const [ready, setReady] = useState(false)

  // Boot sequence
  useEffect(() => {
    const arc = arcRef.current
    const status = statusRef.current
    if (!arc || !status) return

    const C = 2 * Math.PI * 52
    gsap.set(arc, { strokeDasharray: C, strokeDashoffset: C })

    const tl = gsap.timeline()
    tl.to(arc, { strokeDashoffset: 0, duration: 3.4, ease: 'power2.inOut' })

    let i = 0
    const cycle = setInterval(() => {
      if (i < STATUS.length) {
        status.textContent = STATUS[i]
        gsap.fromTo(status, { opacity: 0, y: 6 }, { opacity: 0.7, y: 0, duration: 0.5 })
        i++
      } else {
        clearInterval(cycle)
        setReady(true)
      }
    }, 720)

    return () => {
      clearInterval(cycle)
      tl.kill()
    }
  }, [])

  // Reveal the ENTER affordance
  useEffect(() => {
    if (ready && enterRef.current) {
      gsap.fromTo(enterRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.0, ease: 'power2.out' })
    }
  }, [ready])

  const handleEnter = () => {
    if (!rootRef.current) return
    gsap.to(rootRef.current, {
      opacity: 0,
      duration: 1.4,
      ease: 'power2.inOut',
      onComplete: () => {
        if (rootRef.current) rootRef.current.style.display = 'none'
        onComplete()
      },
    })
  }

  return (
    <div
      ref={rootRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'var(--void)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2.4rem',
      }}
    >
      {/* Corner coordinates */}
      <div style={{ ...corner, top: '2rem', left: '2rem' }}>11°22′N 142°35′E</div>
      <div style={{ ...corner, top: '2rem', right: '2rem' }}>MARIANA TRENCH</div>
      <div style={{ ...corner, bottom: '2rem', left: '2rem' }}>TARGET −11034 M</div>
      <div style={{ ...corner, bottom: '2rem', right: '2rem' }}>ABYSS / EXPEDITION 01</div>

      {/* Precision dial */}
      <svg width="160" height="160" viewBox="0 0 120 120" style={{ overflow: 'visible' }}>
        {/* tick ring */}
        {Array.from({ length: 60 }).map((_, k) => {
          const a = (k / 60) * Math.PI * 2
          const r1 = k % 5 === 0 ? 44 : 47
          const r2 = 50
          return (
            <line
              key={k}
              x1={60 + Math.cos(a) * r1}
              y1={60 + Math.sin(a) * r1}
              x2={60 + Math.cos(a) * r2}
              y2={60 + Math.sin(a) * r2}
              stroke="rgba(63,208,200,0.3)"
              strokeWidth={k % 5 === 0 ? 1 : 0.5}
            />
          )
        })}
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(63,208,200,0.12)" strokeWidth="1" />
        <circle
          ref={arcRef}
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="var(--signal)"
          strokeWidth="1.6"
          transform="rotate(-90 60 60)"
          strokeLinecap="round"
        />
      </svg>

      <div
        ref={statusRef}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          letterSpacing: '0.32em',
          color: 'var(--mute-blue)',
          textTransform: 'uppercase',
          minHeight: '1.2em',
        }}
      />

      {ready && (
        <button
          ref={enterRef}
          onClick={handleEnter}
          data-cursor
          style={{
            background: 'none',
            border: 'none',
            cursor: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.95rem',
            letterSpacing: '0.5em',
            color: 'var(--star-white)',
            textTransform: 'uppercase',
            padding: '0.6rem 0',
          }}
        >
          — DESCEND —
        </button>
      )}
    </div>
  )
}

const corner: React.CSSProperties = {
  position: 'fixed',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.66rem',
  letterSpacing: '0.22em',
  color: 'rgba(159, 180, 189, 0.5)',
  textTransform: 'uppercase',
}
