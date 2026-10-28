import { useEffect, useRef, useState } from 'react'
import { useCombatFxStore, playerCharge } from '../../store/useCombatFxStore'
import { useStatsStore } from '../../store/useStatsStore'

const LOW_HEALTH_RATIO = 0.3
const CHARGE_RING_CIRCUMFERENCE = 2 * Math.PI * 22

// The charge value changes every frame, so the ring is driven straight from
// requestAnimationFrame instead of React state.
function ChargeRing() {
  const wrapRef = useRef()
  const arcRef = useRef()

  useEffect(() => {
    let frame
    const tick = () => {
      const value = playerCharge.value
      if (wrapRef.current) {
        wrapRef.current.style.opacity = value > 0 ? '1' : '0'
        wrapRef.current.classList.toggle('charge-ring--ready', value >= 1)
      }
      if (arcRef.current) arcRef.current.style.strokeDashoffset = `${CHARGE_RING_CIRCUMFERENCE * (1 - value)}`
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div ref={wrapRef} className="charge-ring">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="22" className="charge-ring__track" />
        <circle
          ref={arcRef}
          cx="28"
          cy="28"
          r="22"
          className="charge-ring__arc"
          strokeDasharray={CHARGE_RING_CIRCUMFERENCE}
          strokeDashoffset={CHARGE_RING_CIRCUMFERENCE}
        />
      </svg>
    </div>
  )
}

// Screen-space combat feedback: a red flash when hurt, a pulsing edge while
// health is low, speed lines while sprinting, the heavy-attack charge ring,
// and the combo counter.
export default function CombatOverlay() {
  const [combo, setCombo] = useState(0)
  const [hurtSignal, setHurtSignal] = useState(0)
  const [lowHealth, setLowHealth] = useState(false)
  const [sprinting, setSprinting] = useState(false)

  useEffect(() => {
    const unsubFx = useCombatFxStore.subscribe((s) => {
      setCombo(s.combo)
      setHurtSignal(s.hurtSignal)
      setSprinting(s.sprinting)
    })
    const unsubStats = useStatsStore.subscribe((s) => setLowHealth(s.health > 0 && s.health / s.maxHealth < LOW_HEALTH_RATIO))
    return () => {
      unsubFx()
      unsubStats()
    }
  }, [])

  return (
    <>
      <div className={`speed-lines${sprinting ? ' speed-lines--on' : ''}`} />
      {lowHealth && <div className="vignette vignette--low" />}
      {hurtSignal > 0 && <div key={hurtSignal} className="vignette vignette--hurt" />}
      <ChargeRing />
      {combo >= 2 && (
        <div key={combo} className="combo-counter">
          <span className="combo-counter__num">{combo}</span>
          <span className="combo-counter__label">COMBO</span>
          <span className="combo-counter__bonus">+{Math.min(combo, 10) * 5}% DMG</span>
        </div>
      )}
    </>
  )
}
