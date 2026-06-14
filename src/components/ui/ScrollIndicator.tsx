import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

interface ScrollIndicatorProps {
  delay?: number
  hide?: boolean
  label?: string
}

export default function ScrollIndicator({ delay = 6, hide = false, label = 'Descend' }: ScrollIndicatorProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const hiddenRef = useRef(false)

  useEffect(() => {
    if (!ref.current) return
    if (hide) {
      hiddenRef.current = true
      gsap.to(ref.current, { opacity: 0, duration: 1.2, ease: 'power2.inOut' })
    } else if (hiddenRef.current) {
      hiddenRef.current = false
      gsap.to(ref.current, { opacity: 1, duration: 1.0, ease: 'power2.out' })
    }
  }, [hide])

  useEffect(() => {
    const el = ref.current
    const line = lineRef.current
    if (!el || !line) return

    gsap.set(el, { opacity: 0 })
    gsap.to(el, { opacity: 1, duration: 1.0, delay, ease: 'power2.out' })

    // The draining line falls — implying descent
    gsap.to(line, {
      scaleY: 0,
      transformOrigin: 'top center',
      duration: 1.4,
      delay,
      ease: 'power2.inOut',
      repeat: -1,
      repeatDelay: 0.5,
      onRepeat: () => {
        gsap.set(line, { scaleY: 1, transformOrigin: 'top center' })
      },
    })
  }, [delay])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        bottom: '2.8rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.8rem',
        pointerEvents: 'none',
        userSelect: 'none',
        opacity: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.92rem',
          letterSpacing: '0.42em',
          color: 'rgba(159, 180, 189, 0.9)',
          textTransform: 'uppercase',
          paddingLeft: '0.42em',
        }}
      >
        {label}
      </span>
      <div style={{ width: 2, height: 48, background: 'rgba(63, 208, 200, 0.2)', overflow: 'hidden' }}>
        <div ref={lineRef} style={{ width: '100%', height: '100%', background: 'rgba(63, 208, 200, 0.9)' }} />
      </div>
    </div>
  )
}
