import { useEffect, useState } from 'react'
import { useUIStore } from '../../store/useUIStore'
import { useQuestStore } from '../../store/useQuestStore'
import { QUESTS } from '../../data/quests'

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

  useEffect(() => useUIStore.subscribe((s) => setOpen(s.dialogueOpen)), [])
  useEffect(() => useQuestStore.subscribe((s) => setQuestState(s)), [])

  if (!open) return null

  const { active, completed } = questState

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>떠돌이 상인</h3>
        <button style={buttonStyle} onClick={() => useUIStore.getState().closeDialogue()}>
          닫기 (E)
        </button>
      </div>
      <p style={{ fontSize: 13, opacity: 0.85, marginTop: 0 }}>
        "여행자여, 이 근방엔 도움이 필요한 일들이 있다네. 도와줄 텐가?"
      </p>

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
    </div>
  )
}
