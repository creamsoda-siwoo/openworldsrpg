import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useMonsterRegistry } from '../../store/useMonsterRegistry'
import { useProjectileStore } from '../../store/useProjectileStore'

const ARROW_SPEED = 22
const MAX_LIFETIME = 2.5
const HIT_RADIUS = 1.2

export default function Arrow({ id, position, direction, damage }) {
  const groupRef = useRef()
  const age = useRef(0)
  const [dead, setDead] = useState(false)

  useFrame((_, delta) => {
    if (dead || !groupRef.current) return
    age.current += delta
    if (age.current > MAX_LIFETIME) {
      useProjectileStore.getState().removeArrow(id)
      setDead(true)
      return
    }

    const pos = groupRef.current.position
    pos.x += direction[0] * ARROW_SPEED * delta
    pos.z += direction[1] * ARROW_SPEED * delta

    const { monsters } = useMonsterRegistry.getState()
    for (const monster of Object.values(monsters)) {
      const dx = monster.position[0] - pos.x
      const dz = monster.position[2] - pos.z
      if (Math.hypot(dx, dz) < HIT_RADIUS) {
        monster.hit(damage)
        useProjectileStore.getState().removeArrow(id)
        setDead(true)
        return
      }
    }
  })

  if (dead) return null

  const heading = Math.atan2(direction[0], direction[1])

  return (
    <group ref={groupRef} position={position} rotation={[0, heading, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.04, 0.5, 6]} />
        <meshStandardMaterial color="#8a6d2f" />
      </mesh>
    </group>
  )
}
