import { useEffect, useState } from 'react'
import { useUIStore } from '../../store/useUIStore'
import { useInventoryStore } from '../../store/useInventoryStore'
import { ITEMS } from '../../data/items'

const panelStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: 'rgba(20, 22, 28, 0.95)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 10,
  padding: 20,
  width: 340,
  color: 'white',
  fontFamily: 'system-ui, sans-serif',
  pointerEvents: 'auto',
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
}

const buttonStyle = {
  background: '#3b6bd6',
  border: 'none',
  color: 'white',
  padding: '4px 10px',
  borderRadius: 5,
  cursor: 'pointer',
  fontSize: 12,
}

export default function Inventory() {
  const [open, setOpen] = useState(useUIStore.getState().inventoryOpen)
  const [inventory, setInventory] = useState(useInventoryStore.getState())

  useEffect(() => useUIStore.subscribe((s) => setOpen(s.inventoryOpen)), [])
  useEffect(() => useInventoryStore.subscribe((s) => setInventory(s)), [])

  if (!open) return null

  const entries = Object.entries(inventory.items).filter(([, qty]) => qty > 0)

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>인벤토리</h3>
        <button style={buttonStyle} onClick={() => useUIStore.getState().closeAll()}>
          닫기 (Esc)
        </button>
      </div>

      <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>
        골드: {inventory.gold} &nbsp;|&nbsp; 장착 무기:{' '}
        {inventory.equippedWeaponId ? ITEMS[inventory.equippedWeaponId].name : '맨손'}
      </div>

      {entries.length === 0 && <div style={{ opacity: 0.6, fontSize: 13 }}>아이템이 없습니다.</div>}

      {entries.map(([itemId, qty]) => {
        const item = ITEMS[itemId]
        if (!item) return null
        const isEquipped = inventory.equippedWeaponId === itemId
        return (
          <div key={itemId} style={rowStyle}>
            <div>
              <div>
                {item.name} x{qty}
              </div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{item.description}</div>
            </div>
            {item.type === 'consumable' && (
              <button style={buttonStyle} onClick={() => useInventoryStore.getState().useItem(itemId)}>
                사용
              </button>
            )}
            {item.type === 'weapon' && (
              <button
                style={{ ...buttonStyle, background: isEquipped ? '#555' : '#3b6bd6' }}
                disabled={isEquipped}
                onClick={() => useInventoryStore.getState().equipWeapon(itemId)}
              >
                {isEquipped ? '장착됨' : '장착'}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
