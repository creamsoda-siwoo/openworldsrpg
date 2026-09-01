import { useEffect, useState } from 'react'
import { useStatsStore } from '../../store/useStatsStore'

function Bar({ value, max, color, label }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          width: 220,
          height: 14,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.15s' }} />
        <span
          style={{
            position: 'absolute',
            inset: 0,
            fontSize: 10,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

export default function HUD() {
  const [stats, setStats] = useState(useStatsStore.getState())

  useEffect(() => useStatsStore.subscribe((s) => setStats(s)), [])

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        pointerEvents: 'none',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <Bar value={stats.health} max={stats.maxHealth} color="#e35b5b" label={`HP ${Math.ceil(stats.health)}/${stats.maxHealth}`} />
      <Bar value={stats.stamina} max={stats.maxStamina} color="#e3c25b" label={`STA ${Math.ceil(stats.stamina)}/${stats.maxStamina}`} />
      <Bar value={stats.exp} max={stats.expToNext} color="#5b8fe3" label={`Lv.${stats.level}  EXP ${stats.exp}/${stats.expToNext}`} />
    </div>
  )
}
