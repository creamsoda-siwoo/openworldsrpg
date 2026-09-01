import { useEffect, useState } from 'react'
import { useUIStore } from '../../store/useUIStore'
import { useQuestStore } from '../../store/useQuestStore'
import { useInventoryStore } from '../../store/useInventoryStore'
import { useToastStore } from '../../store/useToastStore'
import { QUESTS } from '../../data/quests'
import { NPC_GREETING } from '../../data/story'
import { ITEMS, SHOP_ITEM_IDS } from '../../data/items'

const panelStyle = {
  position: 'absolute',
  bottom: 100,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(20, 22, 28, 0.95)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 10,
  padding: 18,
  width: 400,
  maxHeight: '60vh',
  overflowY: 'auto',
  color: 'white',
  fontFamily: 'system-ui, sans-serif',
  pointerEvents: 'auto',
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

function questStatusLabel(questId, active, completed) {
  if (completed[questId]) return '완료됨'
  if (active[questId] !== undefined) {
    const quest = QUESTS.find((q) => q.id === questId)
    return `진행 중 (${active[questId]}/${quest.targetCount})`
  }
  return null
}

export default function DialogueBox() {
  const [open, setOpen] = useState(useUIStore.getState().dialogueOpen)
  const [questState, setQuestState] = useState(useQuestStore.getState())
  const [inventory, setInventory] = useState(useInventoryStore.getState())

  useEffect(() => useUIStore.subscribe((s) => setOpen(s.dialogueOpen)), [])
  useEffect(() => useQuestStore.subscribe((s) => setQuestState(s)), [])
  useEffect(() => useInventoryStore.subscribe((s) => setInventory(s)), [])

  if (!open) return null

  const { active, completed } = questState

  const handleBuy = (itemId) => {
    const item = ITEMS[itemId]
    const ok = useInventoryStore.getState().buyItem(itemId)
    useToastStore.getState().push(ok ? `${item.name}을(를) 구매했습니다.` : '골드가 부족합니다.')
  }

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>떠돌이 상인</h3>
        <button style={buttonStyle} onClick={() => useUIStore.getState().closeDialogue()}>
          닫기 (E)
        </button>
      </div>
      {NPC_GREETING.map((line, i) => (
        <p key={i} style={{ fontSize: 13, opacity: 0.85, marginTop: 0 }}>
          {line}
        </p>
      ))}

      {QUESTS.map((quest) => {
        const status = questStatusLabel(quest.id, active, completed)
        return (
          <div
            key={quest.id}
            style={{
              padding: '8px 0',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 13 }}>{quest.title}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{quest.description}</div>
            </div>
            {status ? (
              <span style={{ fontSize: 11, opacity: 0.8 }}>{status}</span>
            ) : (
              <button style={buttonStyle} onClick={() => useQuestStore.getState().acceptQuest(quest.id)}>
                수락
              </button>
            )}
          </div>
        )
      })}

      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>무기상점 (보유 골드: {inventory.gold})</div>
        {SHOP_ITEM_IDS.map((itemId) => {
          const item = ITEMS[itemId]
          const owned = (inventory.items[itemId] || 0) > 0
          return (
            <div
              key={itemId}
              style={{
                padding: '6px 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 13 }}>
                  {item.name} <span style={{ opacity: 0.6, fontSize: 11 }}>({item.price} 골드)</span>
                </div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{item.description}</div>
              </div>
              <button
                style={{ ...buttonStyle, background: owned ? '#555' : '#3b6bd6' }}
                onClick={() => handleBuy(itemId)}
                disabled={owned}
              >
                {owned ? '보유 중' : '구매'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
