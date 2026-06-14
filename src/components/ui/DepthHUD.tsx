import { useEffect, useRef } from 'react'
import { depthForScroll, tempForScroll, pressureForScroll, ZONES } from '../../lib/zones'

interface DepthHUDProps {
  scrollRef: React.MutableRefObject<number>
  velRef: React.MutableRefObject<number>
}

const pad = (n: number, len: number) => Math.round(n).toString().padStart(len, '0')

export default function DepthHUD({ scrollRef, velRef }: DepthHUDProps) {
  const depthRef = useRef<HTMLSpanElement>(null)
  const tempRef = useRef<HTMLSpanElement>(null)
  const pressRef = useRef<HTMLSpanElement>(null)
  const rateRef = useRef<HTMLSpanElement>(null)
  const markerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const s = scrollRef.current
      const d = depthForScroll(s)
      if (depthRef.current) depthRef.current.textContent = `${pad(d, 5)} M`
      if (tempRef.current) tempRef.current.textContent = `${tempForScroll(s).toFixed(1)} °C`
      if (pressRef.current) pressRef.current.textContent = `${pad(pressureForScroll(s), 4)} ATM`
      if (rateRef.current) rateRef.current.textContent = `${(Math.abs(velRef.current) * 60).toFixed(1)} M/S`
      if (markerRef.current) markerRef.current.style.top = `${s * 100}%`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [scrollRef, velRef])

  return (
    <>
      {/* Primary metrics — bottom right */}
      <div style={{ position: 'fixed', bottom: '2.4rem', right: '2.4rem', textAlign: 'right', userSelect: 'none' }}>
        <div style={{ ...big }}>
          <span ref={depthRef}>00000 M</span>
        </div>
        <div style={{ ...row, marginTop: '0.7rem' }}>
          <span style={lbl}>TEMP</span>
          <span ref={tempRef} style={val}>
            19.0 °C
          </span>
        </div>
        <div style={row}>
          <span style={lbl}>PRESSURE</span>
          <span ref={pressRef} style={val}>
            0001 ATM
          </span>
        </div>
        <div style={row}>
          <span style={lbl}>DESCENT</span>
          <span ref={rateRef} style={val}>
            0.0 M/S
          </span>
        </div>
      </div>

      {/* Vertical depth gauge — right edge */}
      <div
        style={{
          position: 'fixed',
          right: '2.4rem',
          top: '20%',
          height: '46%',
          width: 1,
          background: 'rgba(63, 208, 200, 0.18)',
          userSelect: 'none',
        }}
      >
        {ZONES.map((z) => (
          <div key={z.id} style={{ position: 'absolute', top: `${z.start * 100}%`, right: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.54rem',
                letterSpacing: '0.18em',
                color: 'rgba(159, 180, 189, 0.45)',
                whiteSpace: 'nowrap',
              }}
            >
              {z.depth}
            </span>
            <span style={{ width: 6, height: 1, background: 'rgba(63, 208, 200, 0.4)' }} />
          </div>
        ))}
        {/* live marker */}
        <div
          ref={markerRef}
          style={{
            position: 'absolute',
            top: 0,
            right: -3,
            width: 7,
            height: 7,
            marginTop: -3,
            borderRadius: '50%',
            background: 'var(--signal)',
            boxShadow: '0 0 8px var(--signal)',
          }}
        />
      </div>
    </>
  )
}

const big: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '1.5rem',
  fontWeight: 700,
  letterSpacing: '0.12em',
  color: 'var(--star-white)',
}
const row: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '1rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.68rem',
  letterSpacing: '0.2em',
  lineHeight: 1.9,
}
const lbl: React.CSSProperties = { color: 'rgba(159, 180, 189, 0.55)' }
const val: React.CSSProperties = { color: 'var(--mute-blue)', minWidth: '5.5em', textAlign: 'right' }
