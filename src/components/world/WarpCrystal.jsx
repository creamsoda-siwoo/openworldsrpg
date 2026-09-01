import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useWarpStore } from '../../store/useWarpStore'
import { useQuestStore } from '../../store/useQuestStore'
import { useAudioStore } from '../../store/useAudioStore'
import { useToastStore } from '../../store/useToastStore'
import { VILLAGE_WARP_ID } from '../../utils/warpPoints'

const DISCOVER_RADIUS = 2.5

export default function WarpCrystal({ id, name, position }) {
  const crystalRef = useRef()
  const [discovered, setDiscovered] = useState(() => useWarpStore.getState().isDiscovered(id))

  useFrame((state) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y += 0.012
      crystalRef.current.position.y = position[1] + 1.1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1
    }

    if (discovered) return

    const { position: playerPos } = usePlayerStore.getState()
    const dx = playerPos[0] - position[0]
    const dz = playerPos[2] - position[2]
    if (Math.hypot(dx, dz) < DISCOVER_RADIUS) {
      useWarpStore.getState().discover(id)
      const discoveredCount = useWarpStore.getState().discoveredIds.filter((d) => d !== VILLAGE_WARP_ID).length
      useQuestStore.getState().reportDiscover(discoveredCount)
      useAudioStore.getState().playSound('questComplete')
      useToastStore.getState().push(`${name}을(를) 발견했습니다! 지도(M)에서 이동할 수 있습니다.`)
      setDiscovered(true)
    }
  })

  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.4, 1.2, 6]} />
        <meshStandardMaterial color="#5a5a66" roughness={0.8} />
      </mesh>
      <mesh ref={crystalRef} castShadow>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color={discovered ? '#7fd8ff' : '#8888aa'}
          emissive={discovered ? '#3fb6ff' : '#33334a'}
          emissiveIntensity={discovered ? 1.2 : 0.4}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  )
}
