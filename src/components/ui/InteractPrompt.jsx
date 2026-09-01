import { useEffect, useState } from 'react'
import { useUIStore } from '../../store/useUIStore'

export default function InteractPrompt() {
  const [ui, setUi] = useState(useUIStore.getState())

  useEffect(() => useUIStore.subscribe((s) => setUi(s)), [])

  if (!ui.nearNPC || ui.dialogueOpen) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '35%',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        background: 'rgba(0,0,0,0.6)',
        padding: '6px 14px',
        borderRadius: 6,
        fontSize: 13,
        pointerEvents: 'none',
      }}
    >
      E 키를 눌러 대화하기
    </div>
  )
}
