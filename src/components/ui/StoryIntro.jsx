import { useEffect, useState } from 'react'
import { useWorldProgressStore } from '../../store/useWorldProgressStore'
import { useAudioStore } from '../../store/useAudioStore'
import { STORY_INTRO } from '../../data/story'

export default function StoryIntro() {
  const [seen, setSeen] = useState(useWorldProgressStore.getState().hasSeenIntro)

  useEffect(() => useWorldProgressStore.subscribe((s) => setSeen(s.hasSeenIntro)), [])

  if (seen) return null

  const handleStart = () => {
    useWorldProgressStore.getState().markIntroSeen()
    useAudioStore.getState().playSound('uiClose')
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          background: 'rgba(20, 22, 28, 0.97)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 12,
          padding: 28,
          maxWidth: 440,
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h2 style={{ marginTop: 0 }}>{STORY_INTRO.title}</h2>
        {STORY_INTRO.paragraphs.map((paragraph, i) => (
          <p key={i} style={{ lineHeight: 1.6, fontSize: 14, opacity: 0.9 }}>
            {paragraph}
          </p>
        ))}
        <button
          style={{
            marginTop: 12,
            background: '#3b6bd6',
            border: 'none',
            color: 'white',
            padding: '10px 18px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
          }}
          onClick={handleStart}
        >
          모험 시작하기
        </button>
      </div>
    </div>
  )
}
