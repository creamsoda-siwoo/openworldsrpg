import { useEffect, useState } from 'react'
import { useUIStore } from '../../store/useUIStore'
import { useAudioStore } from '../../store/useAudioStore'
import { useToastStore } from '../../store/useToastStore'
import { saveGame, loadGame, clearSaveGame, hasSaveGame } from '../../utils/saveGame'

const panelStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: 'rgba(20, 22, 28, 0.95)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 10,
  padding: 20,
  width: 300,
  color: 'white',
  fontFamily: 'system-ui, sans-serif',
  pointerEvents: 'auto',
}

const buttonStyle = {
  background: '#3b6bd6',
  border: 'none',
  color: 'white',
  padding: '8px 12px',
  borderRadius: 5,
  cursor: 'pointer',
  fontSize: 13,
  width: '100%',
  marginBottom: 8,
}

const dangerButtonStyle = { ...buttonStyle, background: '#a34141' }

export default function SystemMenu() {
  const [open, setOpen] = useState(useUIStore.getState().menuOpen)
  const [audio, setAudio] = useState(useAudioStore.getState())

  useEffect(() => useUIStore.subscribe((s) => setOpen(s.menuOpen)), [])
  useEffect(() => useAudioStore.subscribe((s) => setAudio(s)), [])

  if (!open) return null

  const handleSave = () => {
    const ok = saveGame()
    useToastStore.getState().push(ok ? '게임을 저장했습니다.' : '저장에 실패했습니다.')
  }

  const handleLoad = () => {
    const ok = loadGame()
    useToastStore.getState().push(ok ? '저장된 게임을 불러왔습니다.' : '저장된 게임이 없습니다.')
  }

  const handleNewGame = () => {
    if (!window.confirm('정말 새 게임을 시작할까요? 저장된 진행 상황이 모두 삭제됩니다.')) return
    clearSaveGame()
    window.location.reload()
  }

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ margin: 0 }}>시스템</h3>
        <button style={{ ...buttonStyle, width: 'auto', marginBottom: 0 }} onClick={() => useUIStore.getState().closeAll()}>
          닫기 (P)
        </button>
      </div>

      <button style={buttonStyle} onClick={handleSave}>
        저장하기
      </button>
      <button style={buttonStyle} onClick={handleLoad} disabled={!hasSaveGame()}>
        불러오기
      </button>
      <button style={dangerButtonStyle} onClick={handleNewGame}>
        새 게임 (초기화)
      </button>

      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13 }}>음량</span>
          <button
            style={{ ...buttonStyle, width: 'auto', marginBottom: 0, padding: '4px 10px', background: audio.muted ? '#555' : '#3b6bd6' }}
            onClick={() => useAudioStore.getState().toggleMuted()}
          >
            {audio.muted ? '음소거됨' : '소리 켜짐'}
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={audio.volume}
          onChange={(e) => useAudioStore.getState().setVolume(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <p style={{ fontSize: 11, opacity: 0.6, marginTop: 14, marginBottom: 0 }}>
        30초마다 자동 저장됩니다. 몬스터 처치 및 아이템 습득 상태도 함께 저장됩니다.
      </p>
    </div>
  )
}
