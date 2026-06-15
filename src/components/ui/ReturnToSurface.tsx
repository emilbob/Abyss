import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface ReturnToSurfaceProps {
  visible: boolean
  onClick: () => void
}

// An up-arrow that surfaces once the diver has descended — a quick ascent back
// to 0 m. Hidden at the surface, fades in below it.
export default function ReturnToSurface({ visible, onClick }: ReturnToSurfaceProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const arrowRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.to(ref.current, {
      opacity: visible ? 1 : 0,
      y: visible ? 0 : 8,
      duration: 0.7,
      ease: 'power2.out',
      pointerEvents: visible ? 'auto' : 'none',
    })
  }, [visible])

  const nudge = (dir: number) => {
    if (arrowRef.current) gsap.to(arrowRef.current, { y: dir, duration: 0.3, ease: 'power2.out' })
  }

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => nudge(-3)}
      onMouseLeave={() => nudge(0)}
      aria-label="Return to surface"
      data-cursor
      style={{
        position: 'fixed',
        left: 'var(--pad)',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.55rem',
        background: 'none',
        border: 'none',
        cursor: 'none',
        opacity: 0,
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '1px solid rgba(63, 208, 200, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span ref={arrowRef} style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color: 'var(--signal)', lineHeight: 1 }}>
          ↑
        </span>
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.54rem',
          letterSpacing: '0.28em',
          color: 'var(--mute-blue)',
          textTransform: 'uppercase',
        }}
      >
        Surface
      </span>
    </button>
  )
}
