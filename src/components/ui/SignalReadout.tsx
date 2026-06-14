import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface SignalReadoutProps {
  zone: number
}

const MESSAGES: Record<number, string[]> = {
  5: ['◦ UNKNOWN SIGNAL DETECTED', 'SOURCE — UNRESOLVED', 'FREQ 0.021 HZ · −6000 M'],
  6: ['◦ TRANSMISSION PERSISTS', 'ORIGIN — BELOW', 'WE ARE NOT THE FIRST HERE'],
}

export default function SignalReadout({ zone }: SignalReadoutProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])
  const lines = MESSAGES[zone] ?? []
  const visible = zone === 5 || zone === 6

  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (visible) {
      const els = lineRefs.current.filter(Boolean) as HTMLDivElement[]
      gsap.killTweensOf(els)
      gsap.fromTo(
        els,
        { opacity: 0, y: 10 },
        { opacity: 0.85, y: 0, duration: 1.4, stagger: 0.25, ease: 'power3.out' },
      )
      // breathing pulse on the lead line
      if (els[0]) {
        gsap.to(els[0], { opacity: 0.35, duration: 1.6, delay: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' })
      }
    } else {
      gsap.to(root, { opacity: 0, duration: 0.8, ease: 'power2.in' })
    }
  }, [zone, visible])

  if (!visible) return null

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.9rem',
        pointerEvents: 'none',
        userSelect: 'none',
        textAlign: 'center',
      }}
    >
      {lines.map((line, i) => (
        <div
          key={`${zone}-${i}`}
          ref={(el) => {
            lineRefs.current[i] = el
          }}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: i === 0 ? '0.92rem' : '0.7rem',
            letterSpacing: i === 0 ? '0.36em' : '0.28em',
            color: i === 0 ? 'var(--signal)' : 'var(--mute-blue)',
            textTransform: 'uppercase',
            paddingLeft: i === 0 ? '0.36em' : '0.28em',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  )
}
