import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { terrainHeightAt } from '../../utils/terrain'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useUIStore } from '../../store/useUIStore'
import HumanCharacter from '../character/HumanCharacter'

const INTERACT_RADIUS = 2.5
const IDLE_SPEED_REF = { current: 0 }
const MARKER_HEIGHT = 2.1

export const NPC_POSITION = [6, terrainHeightAt(6, 6), 6]

export default function NPC() {
  const wasNear = useRef(false)
  const markerRef = useRef()

  useFrame((state) => {
    const { position: playerPos } = usePlayerStore.getState()
    const dx = playerPos[0] - NPC_POSITION[0]
    const dz = playerPos[2] - NPC_POSITION[2]
    const near = Math.hypot(dx, dz) < INTERACT_RADIUS

    if (near !== wasNear.current) {
      wasNear.current = near
      useUIStore.getState().setNearNPC(near)
      if (!near) useUIStore.getState().closeDialogue()
    }

    if (markerRef.current) {
      markerRef.current.position.y = MARKER_HEIGHT + Math.sin(state.clock.elapsedTime * 2) * 0.08
      markerRef.current.rotation.y += 0.02
    }
  })

  return (
    <group position={NPC_POSITION}>
      <HumanCharacter speedRef={IDLE_SPEED_REF} />
      <mesh ref={markerRef} position={[0, MARKER_HEIGHT, 0]}>
        <octahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial color="#f4c542" emissive="#a3791a" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}
