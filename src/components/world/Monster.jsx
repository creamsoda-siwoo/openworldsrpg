import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { terrainHeightAt } from '../../utils/terrain'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useStatsStore } from '../../store/useStatsStore'
import { useQuestStore } from '../../store/useQuestStore'
import { useInventoryStore } from '../../store/useInventoryStore'
import { registerMonster, unregisterMonster } from '../../store/useMonsterRegistry'
import { useWorldProgressStore } from '../../store/useWorldProgressStore'
import { useAudioStore } from '../../store/useAudioStore'
import { useToastStore } from '../../store/useToastStore'

const DETECT_RANGE = 9
const ATTACK_RANGE = 1.6
const SPEED = 2.4
const WANDER_SPEED = 1
const WANDER_RADIUS = 6
const ATTACK_DAMAGE = 6
const ATTACK_INTERVAL = 1.2
const MAX_HEALTH = 30
const BODY_HALF_HEIGHT = 0.35
const EXP_REWARD = 15
const RESPAWN_DELAY_MS = 60_000

const STATE = { IDLE: 'idle', CHASE: 'chase', ATTACK: 'attack' }

export default function Monster({ id, spawnPosition }) {
  const groupRef = useRef()
  const health = useRef(MAX_HEALTH)
  const state = useRef(STATE.IDLE)
  const wanderTarget = useRef([spawnPosition[0], spawnPosition[2]])
  const idleTimer = useRef(0)
  const attackCooldown = useRef(0)
  const registryEntry = useRef(null)
  const [isDead, setIsDead] = useState(() => !useWorldProgressStore.getState().isMonsterAlive(id))

  useEffect(() => {
    if (isDead) return undefined
    const entry = {
      position: spawnPosition,
      hit: (damage) => {
        if (health.current <= 0) return
        health.current -= damage
        useAudioStore.getState().playSound('hit')
        if (health.current <= 0) {
          useWorldProgressStore.getState().markMonsterDefeated(id, RESPAWN_DELAY_MS)
          useQuestStore.getState().reportDefeat('slime')
          useStatsStore.getState().gainExp(EXP_REWARD)
          useInventoryStore.getState().addItem('slimeGel', 1)
          useAudioStore.getState().playSound('monsterDeath')
          useToastStore.getState().push(`슬라임을 처치했습니다 (+${EXP_REWARD} EXP)`)
          setIsDead(true)
        }
      },
    }
    registryEntry.current = entry
    registerMonster(id, entry)
    return () => unregisterMonster(id)
  }, [id, spawnPosition, isDead])

  useFrame((_, delta) => {
    if (isDead) {
      const respawnAt = useWorldProgressStore.getState().monsterRespawnAt[id]
      if (respawnAt && Date.now() >= respawnAt) {
        health.current = MAX_HEALTH
        state.current = STATE.IDLE
        wanderTarget.current = [spawnPosition[0], spawnPosition[2]]
        setIsDead(false)
      }
      return
    }

    if (!groupRef.current) return

    const pos = groupRef.current.position
    const { position: playerPos } = usePlayerStore.getState()
    const dx = playerPos[0] - pos.x
    const dz = playerPos[2] - pos.z
    const distToPlayer = Math.hypot(dx, dz)

    if (attackCooldown.current > 0) attackCooldown.current -= delta

    if (distToPlayer < ATTACK_RANGE) state.current = STATE.ATTACK
    else if (distToPlayer < DETECT_RANGE) state.current = STATE.CHASE
    else state.current = STATE.IDLE

    if (state.current === STATE.ATTACK) {
      if (attackCooldown.current <= 0) {
        useStatsStore.getState().takeDamage(ATTACK_DAMAGE)
        attackCooldown.current = ATTACK_INTERVAL
      }
      groupRef.current.rotation.y = Math.atan2(dx, dz)
    } else if (state.current === STATE.CHASE) {
      const dirX = dx / distToPlayer
      const dirZ = dz / distToPlayer
      pos.x += dirX * SPEED * delta
      pos.z += dirZ * SPEED * delta
      groupRef.current.rotation.y = Math.atan2(dx, dz)
    } else {
      const tx = wanderTarget.current[0] - pos.x
      const tz = wanderTarget.current[1] - pos.z
      const distToTarget = Math.hypot(tx, tz)

      idleTimer.current -= delta
      if (distToTarget < 0.5 || idleTimer.current <= 0) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * WANDER_RADIUS
        wanderTarget.current = [
          spawnPosition[0] + Math.cos(angle) * radius,
          spawnPosition[2] + Math.sin(angle) * radius,
        ]
        idleTimer.current = 2 + Math.random() * 3
      } else if (distToTarget > 0.01) {
        pos.x += (tx / distToTarget) * WANDER_SPEED * delta
        pos.z += (tz / distToTarget) * WANDER_SPEED * delta
        groupRef.current.rotation.y = Math.atan2(tx, tz)
      }
    }

    pos.y = terrainHeightAt(pos.x, pos.z) + BODY_HALF_HEIGHT

    if (registryEntry.current) {
      registryEntry.current.position = [pos.x, pos.y, pos.z]
    }
  })

  if (isDead) return null

  return (
    <group ref={groupRef} position={spawnPosition}>
      <mesh castShadow scale={[1, 0.7, 1]}>
        <sphereGeometry args={[0.5, 12, 10]} />
        <meshStandardMaterial color="#5fd67a" transparent opacity={0.92} roughness={0.4} />
      </mesh>
      <mesh position={[-0.15, 0.15, 0.4]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.15, 0.15, 0.4]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )
}
