// Fixed atmospheric telemetry — pure instrument chrome at low opacity.

const corner: React.CSSProperties = {
  position: 'fixed',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.62rem',
  letterSpacing: '0.22em',
  color: 'rgba(159, 180, 189, 0.35)',
  textTransform: 'uppercase',
  lineHeight: 1.9,
  pointerEvents: 'none',
  userSelect: 'none',
}

export default function Telemetry() {
  return (
    <>
      {/* top-right vessel + position */}
      <div className="telemetry-chrome" style={{ ...corner, top: 'var(--pad)', right: 'var(--pad)', textAlign: 'right' }}>
        <div>DSV — ABYSS / 01</div>
        <div>11.3733°N 142.5917°E</div>
        <div>HULL INTEGRITY · NOMINAL</div>
      </div>

      {/* bottom-left mission */}
      <div className="telemetry-chrome" style={{ ...corner, bottom: 'var(--pad)', left: 'var(--pad)' }}>
        <div>MARIANA TRENCH</div>
        <div>EXPEDITION LOG · OPEN</div>
      </div>
    </>
  )
}
