import { useEffect, useRef } from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useWorldStore } from '../../store/useWorldStore'
import { useWarpStore } from '../../store/useWarpStore'
import { SCENERY } from '../../utils/scenery'
import { WARP_POINTS } from '../../utils/warpPoints'

const CANVAS_SIZE = 180
const CANVAS_HEIGHT = CANVAS_SIZE + 24
const VIEW_RADIUS = 50

function formatClock(timeOfDay) {
  const totalMinutes = Math.floor(timeOfDay * 24 * 60)
  const hours = Math.floor(totalMinutes / 60) % 24
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export default function Minimap() {
  const canvasRef = useRef()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let frameId

    const draw = () => {
      const { position, heading } = usePlayerStore.getState()
      const { timeOfDay } = useWorldStore.getState()
      const [px, , pz] = position
      const center = CANVAS_SIZE / 2
      const scale = center / VIEW_RADIUS

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_HEIGHT)

      ctx.save()
      ctx.beginPath()
      ctx.arc(center, center, center - 2, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(10, 20, 15, 0.55)'
      ctx.fill()
      ctx.clip()

      const drawDot = (x, z, color, size) => {
        const dx = x - px
        const dz = z - pz
        if (Math.hypot(dx, dz) > VIEW_RADIUS) return
        const cx = center + dx * scale
        const cy = center + dz * scale
        ctx.beginPath()
        ctx.arc(cx, cy, size, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
      }

      SCENERY.trees.forEach((t) => drawDot(t.position[0], t.position[2], '#4caf6a', 2))
      SCENERY.rocks.forEach((r) => drawDot(r.position[0], r.position[2], '#a3a39c', 2))

      const { discoveredIds } = useWarpStore.getState()
      WARP_POINTS.forEach((p) => {
        if (!discoveredIds.includes(p.id)) return
        drawDot(p.position[0], p.position[2], '#7fd8ff', 3)
      })

      ctx.restore()

      ctx.beginPath()
      ctx.arc(center, center, center - 2, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('N', center, 12)
      ctx.fillText('S', center, CANVAS_SIZE - 12)
      ctx.fillText('E', CANVAS_SIZE - 12, center)
      ctx.fillText('W', 12, center)

      // Player heading arrow, derived directly from the same
      // atan2(x, z) convention PlayerController uses for facing.
      const dirX = Math.sin(heading)
      const dirZ = Math.cos(heading)
      const perpX = -dirZ
      const perpZ = dirX
      const tipLen = 9
      const backLen = 6
      const baseWidth = 5

      const tip = [center + dirX * tipLen, center + dirZ * tipLen]
      const backCenter = [center - dirX * backLen, center - dirZ * backLen]
      const left = [backCenter[0] + perpX * baseWidth, backCenter[1] + perpZ * baseWidth]
      const right = [backCenter[0] - perpX * baseWidth, backCenter[1] - perpZ * baseWidth]

      ctx.beginPath()
      ctx.moveTo(tip[0], tip[1])
      ctx.lineTo(left[0], left[1])
      ctx.lineTo(right[0], right[1])
      ctx.closePath()
      ctx.fillStyle = '#3b6bd6'
      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.font = '12px system-ui, sans-serif'
      ctx.fillText(formatClock(timeOfDay), center, CANVAS_SIZE + 14)

      frameId = requestAnimationFrame(draw)
    }

    frameId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameId)
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: CANVAS_SIZE,
        height: CANVAS_HEIGHT,
        pointerEvents: 'none',
      }}
    >
      <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_HEIGHT} />
    </div>
  )
}
