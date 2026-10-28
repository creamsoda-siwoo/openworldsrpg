import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { terrainHeightAt } from '../../utils/terrain'
import HumanCharacter from '../character/HumanCharacter'

const WANDER_RADIUS = 1.2
const WANDER_SPEED = 0.6

// Purely decorative resident that ambles around its house - no interaction,
// no aggro, just population so the village doesn't feel empty.
export default function Villager({ anchor }) {
  const groupRef = useRef()
  const speedRef = useRef(0)
  const wanderTarget = useRef([anchor[0], anchor[2]])
  const idleTimer = useRef(0)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const pos = groupRef.current.position
    const tx = wanderTarget.current[0] - pos.x
    const tz = wanderTarget.current[1] - pos.z
    const dist = Math.hypot(tx, tz)

    idleTimer.current -= delta
    if (dist < 0.3 || idleTimer.current <= 0) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * WANDER_RADIUS
      wanderTarget.current = [anchor[0] + Math.cos(angle) * radius, anchor[2] + Math.sin(angle) * radius]
      idleTimer.current = 3 + Math.random() * 4
      speedRef.current = 0
    } else {
      pos.x += (tx / dist) * WANDER_SPEED * delta
      pos.z += (tz / dist) * WANDER_SPEED * delta
      groupRef.current.rotation.y = Math.atan2(tx, tz)
      speedRef.current = WANDER_SPEED
    }

    pos.y = terrainHeightAt(pos.x, pos.z)
  })

  return (
    <group ref={groupRef} position={anchor}>
      <HumanCharacter speedRef={speedRef} walkSpeedReference={WANDER_SPEED} />
    </group>
  )
}
