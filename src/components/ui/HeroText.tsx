import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface HeroTextProps {
  delay?: number
  hide?: boolean
}

const TITLE = 'ABYSS'

export default function HeroText({ delay = 0, hide = false }: HeroTextProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const charsRef = useRef<(HTMLSpanElement | null)[]>([])
  const ruleRef = useRef<HTMLDivElement>(null)
  const subRef = useRef<HTMLDivElement>(null)
  const hiddenRef = useRef(false)

  useEffect(() => {
    const chars = charsRef.current.filter(Boolean) as HTMLSpanElement[]
    const rule = ruleRef.current
    const sub = subRef.current
    if (!rule || !sub) return

    const tl = gsap.timeline({ delay })
    tl.fromTo(
      chars,
      { opacity: 0, y: 24, rotateX: -15 },
      { opacity: 1, y: 0, rotateX: 0, duration: 1.6, stagger: 0.07, ease: 'power4.out' },
    )
      .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power3.out' }, '-=0.5')
      .fromTo(sub, { opacity: 0, y: 10 }, { opacity: 0.92, y: 0, duration: 1.2, ease: 'power2.out' }, '-=0.6')
  }, [delay])

  useEffect(() => {
    if (!rootRef.current) return
    if (hide && !hiddenRef.current) {
      hiddenRef.current = true
      gsap.to(rootRef.current, { opacity: 0, y: -20, duration: 1.4, ease: 'power2.inOut' })
    } else if (!hide && hiddenRef.current) {
      hiddenRef.current = false
      gsap.to(rootRef.current, { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' })
    }
  }, [hide])

  return (
    <div
      ref={rootRef}
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: 'clamp(2.8rem, 8.5vw, 8.5rem)',
          letterSpacing: '0.22em',
          color: 'var(--star-white)',
          lineHeight: 1,
          display: 'flex',
          paddingLeft: '0.22em',
          textShadow: '0 0 16px rgba(0,0,0,0.4)',
        }}
      >
        {TITLE.split('').map((c, i) => (
          <span
            key={i}
            ref={(el) => {
              charsRef.current[i] = el
            }}
            style={{ display: 'inline-block' }}
          >
            {c}
          </span>
        ))}
      </div>
      <div
        ref={ruleRef}
        style={{
          width: 'min(42vw, 420px)',
          height: 1,
          margin: '1.6rem 0',
          background:
            'linear-gradient(90deg, transparent, rgba(63,208,200,0.45) 30%, rgba(63,208,200,0.45) 70%, transparent)',
          transformOrigin: 'center',
        }}
      />
      <div
        ref={subRef}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(0.6rem, 1.4vw, 0.8rem)',
          letterSpacing: '0.42em',
          color: 'var(--star-white)',
          textTransform: 'uppercase',
          paddingLeft: '0.42em',
          textShadow: '0 0 12px rgba(0,0,0,0.45)',
        }}
      >
        An Expedition Into The Unknown
      </div>
    </div>
  )
}
