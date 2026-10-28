import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useMonsterRegistry } from '../../store/useMonsterRegistry'
import { useProjectileStore } from '../../store/useProjectileStore'
import { useCombatFxStore } from '../../store/useCombatFxStore'

const ARROW_SPEED = 22
const MAX_LIFETIME = 2.5
const HIT_RADIUS = 1.2

// Piercing arrows (from a charged shot) keep flying through enemies, hitting
// each one at most once.
export default function Arrow({ id, position, direction, damage, pierce }) {
  const groupRef = useRef()
  const age = useRef(0)
  const hitIds = useRef(new Set())
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
    for (const [monsterId, monster] of Object.entries(monsters)) {
      if (hitIds.current.has(monsterId)) continue
      const dx = monster.position[0] - pos.x
      const dz = monster.position[2] - pos.z
      if (Math.hypot(dx, dz) < HIT_RADIUS) {
        hitIds.current.add(monsterId)
        const fx = useCombatFxStore.getState()
        const roll = fx.rollDamage(damage)
        monster.hit(roll.damage, { crit: roll.crit, from: [pos.x - direction[0], pos.y, pos.z - direction[1]] })
        fx.registerComboHit()
        if (pierce) continue
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
        <meshStandardMaterial color={pierce ? '#ffd27f' : '#8a6d2f'} emissive={pierce ? '#ff9a2e' : '#000000'} />
      </mesh>
    </group>
  )
}
