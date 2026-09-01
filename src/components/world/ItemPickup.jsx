import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useInventoryStore } from '../../store/useInventoryStore'
import { useWorldProgressStore } from '../../store/useWorldProgressStore'

const PICKUP_RADIUS = 1.4
const BOB_HEIGHT = 0.15
const BOB_SPEED = 2

export default function ItemPickup({ id, itemId, position }) {
  const meshRef = useRef()
  const timeOffset = useRef(Math.random() * Math.PI * 2)
  const [collected, setCollected] = useState(() => useWorldProgressStore.getState().isItemCollected(id))

  useFrame((state) => {
    if (collected || !meshRef.current) return

    meshRef.current.rotation.y += 0.02
    meshRef.current.position.y =
      position[1] + 0.5 + Math.sin(state.clock.elapsedTime * BOB_SPEED + timeOffset.current) * BOB_HEIGHT

    const { position: playerPos } = usePlayerStore.getState()
    const dx = playerPos[0] - position[0]
    const dz = playerPos[2] - position[2]
    if (Math.hypot(dx, dz) < PICKUP_RADIUS) {
      useInventoryStore.getState().addItem(itemId, 1)
      useWorldProgressStore.getState().markItemCollected(id)
      setCollected(true)
    }
  })

  if (collected) return null

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <icosahedronGeometry args={[0.25, 0]} />
      <meshStandardMaterial color="#8fd45a" emissive="#3f7a2a" emissiveIntensity={0.4} />
    </mesh>
  )
}
