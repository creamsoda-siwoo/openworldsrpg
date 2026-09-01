import { useEffect, useState } from 'react'
import { useQuestStore } from '../../store/useQuestStore'
import { QUESTS } from '../../data/quests'

export default function QuestTracker() {
  const [active, setActive] = useState(useQuestStore.getState().active)

  useEffect(() => useQuestStore.subscribe((s) => setActive(s.active)), [])

  const entries = Object.entries(active)
  if (entries.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 100,
        left: 16,
        color: 'white',
        fontSize: 13,
        background: 'rgba(0,0,0,0.45)',
        padding: '8px 12px',
        borderRadius: 8,
        pointerEvents: 'none',
        minWidth: 180,
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 4, opacity: 0.8 }}>진행 중인 퀘스트</div>
      {entries.map(([questId, progress]) => {
        const quest = QUESTS.find((q) => q.id === questId)
        if (!quest) return null
        return (
          <div key={questId}>
            {quest.title} ({progress}/{quest.targetCount})
          </div>
        )
      })}
    </div>
  )
}
