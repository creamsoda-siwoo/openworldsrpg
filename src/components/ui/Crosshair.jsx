import { useEffect, useState } from 'react'
import { useInventoryStore } from '../../store/useInventoryStore'
import { ITEMS } from '../../data/items'

export default function Crosshair() {
  const [equippedWeaponId, setEquippedWeaponId] = useState(useInventoryStore.getState().equippedWeaponId)

  useEffect(() => useInventoryStore.subscribe((s) => setEquippedWeaponId(s.equippedWeaponId)), [])

  const isRanged = equippedWeaponId && ITEMS[equippedWeaponId]?.attackType === 'ranged'
  if (!isRanged) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 10,
        height: 10,
        pointerEvents: 'none',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, border: '1.5px solid rgba(255,255,255,0.85)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: -6, left: '50%', width: 1.5, height: 4, background: 'rgba(255,255,255,0.85)' }} />
      <div style={{ position: 'absolute', bottom: -6, left: '50%', width: 1.5, height: 4, background: 'rgba(255,255,255,0.85)' }} />
      <div style={{ position: 'absolute', left: -6, top: '50%', height: 1.5, width: 4, background: 'rgba(255,255,255,0.85)' }} />
      <div style={{ position: 'absolute', right: -6, top: '50%', height: 1.5, width: 4, background: 'rgba(255,255,255,0.85)' }} />
    </div>
  )
}
