import { useEffect, useRef } from 'react'
import { clamp01, smoothstep } from '../../lib/env'

interface EndMessageProps {
  scrollRef: React.MutableRefObject<number>
}

// The ending: discoveries thin out into sand and dark, then a final message
// rises and everything fades to black.
export default function EndMessage({ scrollRef }: EndMessageProps) {
  const blackRef = useRef<HTMLDivElement>(null)
  const msgRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const s = scrollRef.current
      // black veil closes in over the final stretch
      const black = clamp01((s - 0.93) / 0.06)
      if (blackRef.current) blackRef.current.style.opacity = String(black)
      // message fades in, holds, lingers on the black
      const msg = smoothstep(clamp01((s - 0.9) / 0.04))
      if (msgRef.current) msgRef.current.style.opacity = String(msg)
      // only allow the restart click once the message is actually shown
      if (btnRef.current) btnRef.current.style.pointerEvents = msg > 0.5 ? 'auto' : 'none'
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [scrollRef])

  const restart = () => window.location.reload()

  return (
    <>
      <div
        ref={blackRef}
        style={{
          position: 'fixed',
          inset: 0,
          background: '#000000',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        ref={msgRef}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          opacity: 0,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: 'clamp(1.6rem, 4vw, 3rem)',
            letterSpacing: '0.12em',
            color: 'var(--star-white)',
            lineHeight: 1.2,
          }}
        >
          The Ocean Keeps Its Secrets
        </div>
        <button
          ref={btnRef}
          onClick={restart}
          data-cursor
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--signal)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--mute-blue)')}
          style={{
            display: 'block',
            margin: '1.6rem auto 0',
            background: 'none',
            border: 'none',
            cursor: 'none',
            pointerEvents: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            letterSpacing: '0.42em',
            color: 'var(--mute-blue)',
            textTransform: 'uppercase',
            paddingLeft: '0.42em',
            transition: 'color 0.4s ease',
          }}
        >
          End Of Descent ↻
        </button>
      </div>
    </>
  )
}
