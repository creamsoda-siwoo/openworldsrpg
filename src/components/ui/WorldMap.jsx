import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useWarpStore } from '../../store/useWarpStore'
import { useUIStore } from '../../store/useUIStore'
import { useAudioStore } from '../../store/useAudioStore'
import { WARP_POINTS, VILLAGE_WARP_ID } from '../../utils/warpPoints'
import { TERRAIN_SIZE } from '../../utils/terrain'
import { NPC_POSITION } from '../world/NPC'

const MAP_SIZE = 460
const WORLD_HALF = TERRAIN_SIZE / 2
const MAP_MARGIN = 24

function worldToMap(x, z) {
  const half = MAP_SIZE / 2 - MAP_MARGIN
  return {
    x: MAP_SIZE / 2 + (x / WORLD_HALF) * half,
    y: MAP_SIZE / 2 + (z / WORLD_HALF) * half,
  }
}

export default function WorldMap() {
  const canvasRef = useRef()
  const [open, setOpen] = useState(useUIStore.getState().mapOpen)
  const [discovered, setDiscovered] = useState(useWarpStore.getState().discoveredIds)

  useEffect(() => useUIStore.subscribe((s) => setOpen(s.mapOpen)), [])
  useEffect(() => useWarpStore.subscribe((s) => setDiscovered(s.discoveredIds)), [])

  useEffect(() => {
    if (!open) return undefined
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let frameId

    const draw = () => {
      ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE)
      ctx.fillStyle = '#2b5c33'
      ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE)
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 2
      ctx.strokeRect(3, 3, MAP_SIZE - 6, MAP_SIZE - 6)

      const npc = worldToMap(NPC_POSITION[0], NPC_POSITION[2])
      ctx.beginPath()
      ctx.arc(npc.x, npc.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#a355d9'
      ctx.fill()

      WARP_POINTS.forEach((p) => {
        if (!discovered.includes(p.id)) return
        const { x, y } = worldToMap(p.position[0], p.position[2])
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI * 2)
        ctx.fillStyle = p.id === VILLAGE_WARP_ID ? '#f4c542' : '#7fd8ff'
        ctx.fill()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.fillStyle = 'white'
        ctx.font = '12px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(p.name, x, y - 14)
      })

      const { position } = usePlayerStore.getState()
      const pp = worldToMap(position[0], position[2])
      ctx.beginPath()
      ctx.arc(pp.x, pp.y, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#3b6bd6'
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 1.5
      ctx.stroke()

      frameId = requestAnimationFrame(draw)
    }

    frameId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameId)
  }, [open, discovered])

  if (!open) return null

  const handleClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const cx = event.clientX - rect.left
    const cy = event.clientY - rect.top

    for (const p of WARP_POINTS) {
      if (!discovered.includes(p.id)) continue
      const { x, y } = worldToMap(p.position[0], p.position[2])
      if (Math.hypot(cx - x, cy - y) < 12) {
        useWarpStore.getState().requestWarp([p.position[0], p.position[2]])
        useAudioStore.getState().playSound('uiClose')
        useUIStore.getState().closeAll()
        return
      }
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          background: 'rgba(20, 22, 28, 0.95)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 10,
          padding: 16,
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>세계지도</h3>
          <button
            style={{ background: '#3b6bd6', border: 'none', color: 'white', padding: '4px 10px', borderRadius: 5, cursor: 'pointer' }}
            onClick={() => useUIStore.getState().closeAll()}
          >
            닫기 (M)
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={MAP_SIZE}
          height={MAP_SIZE}
          style={{ cursor: 'pointer', borderRadius: 6, display: 'block' }}
          onClick={handleClick}
        />
        <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8, marginBottom: 0 }}>
          발견한 결정탑(하늘색)을 클릭하면 그 위치로 이동합니다. 노란 점은 마을, 보라 점은 상인입니다.
        </p>
      </div>
    </div>
  )
}
