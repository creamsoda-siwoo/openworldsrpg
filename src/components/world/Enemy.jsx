import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { terrainHeightAt } from '../../utils/terrain'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useStatsStore } from '../../store/useStatsStore'
import { useQuestStore } from '../../store/useQuestStore'
import { useInventoryStore } from '../../store/useInventoryStore'
import { registerMonster, unregisterMonster } from '../../store/useMonsterRegistry'
import { useWorldProgressStore } from '../../store/useWorldProgressStore'
import { useAudioStore } from '../../store/useAudioStore'
import { useToastStore } from '../../store/useToastStore'
import { useCombatFxStore, reportEnemyHit, reportEnemyDeath } from '../../store/useCombatFxStore'
import { VILLAGE_CENTER, VILLAGE_SAFE_RADIUS } from '../../utils/villageLayout'
import { createHitReaction, triggerHitReaction, stepHitReaction } from '../../utils/hitReaction'

// Shared AI + combat for every melee enemy. Attacks are telegraphed: the enemy
// stops, crouches and flashes a "!" (WINDUP), then lunges along a direction
// locked at the end of the windup (LUNGE), then stands open for a moment
// (RECOVER). That gives the player a readable window to dodge-roll through
// the lunge or punish the recovery.
const STATE = { IDLE: 'idle', CHASE: 'chase', WINDUP: 'windup', LUNGE: 'lunge', RECOVER: 'recover' }

// Facing keeps tracking the player for most of the windup, then freezes so a
// well-timed sidestep actually makes the lunge miss.
const WINDUP_TRACKING_RATIO = 0.7
const LUNGE_HIT_RADIUS_RATIO = 0.75

const ELITE_CHANCE = 0.15
const ELITE = { scale: 1.45, health: 3, damage: 1.5, exp: 3, drops: 3, speed: 1.15 }
const ELITE_TINT = '#ffb300'

const ORB_DROPS_MIN = 2
const ORB_DROPS_RANDOM = 3

function rollElite() {
  return Math.random() < ELITE_CHANCE
}

export default function Enemy({ id, spawnPosition, config, children }) {
  const groupRef = useRef()
  const bodyRef = useRef()
  const hpFillRef = useRef()
  const hpBarRef = useRef()
  const warnRef = useRef()
  const [elite, setElite] = useState(rollElite)
  const maxHealth = config.maxHealth * (elite ? ELITE.health : 1)
  const health = useRef(maxHealth)
  const state = useRef(STATE.IDLE)
  const stateTimer = useRef(0)
  const lungeDir = useRef([0, 1])
  const lungeHit = useRef(false)
  const wanderTarget = useRef([spawnPosition[0], spawnPosition[2]])
  const idleTimer = useRef(0)
  const registryEntry = useRef(null)
  const reaction = useRef(createHitReaction())
  const [isDead, setIsDead] = useState(() => !useWorldProgressStore.getState().isMonsterAlive(id))

  const bodyScale = elite ? ELITE.scale : 1
  const halfHeight = config.bodyHalfHeight * bodyScale

  // Gold-tint elites by baking the glow into each material's base emissive
  // before the first hit flash caches it (see hitReaction.setFlash).
  useEffect(() => {
    if (isDead || !elite || !bodyRef.current) return
    bodyRef.current.traverse((obj) => {
      const mat = obj.material
      if (!mat?.emissive) return
      mat.emissive.set(ELITE_TINT)
      mat.emissiveIntensity = Math.max(mat.emissiveIntensity, 0.35)
    })
  }, [elite, isDead])

  useEffect(() => {
    if (isDead) return undefined
    const entry = {
      position: spawnPosition,
      hit: (damage, { crit = false, launch = false, from } = {}) => {
        if (health.current <= 0) return
        health.current -= damage
        // Elites have super armor: only heavy hits interrupt their attacks.
        const interrupt = !elite || crit || launch
        triggerHitReaction(reaction.current, from, entry.position, { crit, launch, stagger: interrupt })
        if (interrupt && (state.current === STATE.WINDUP || state.current === STATE.LUNGE)) {
          state.current = STATE.RECOVER
          stateTimer.current = config.recover
        }
        reportEnemyHit(entry.position, damage, crit)

        if (hpBarRef.current && hpFillRef.current) {
          hpBarRef.current.style.opacity = '1'
          hpFillRef.current.style.width = `${Math.max(0, (health.current / maxHealth) * 100)}%`
        }

        if (health.current <= 0) {
          const exp = config.expReward * (elite ? ELITE.exp : 1)
          const fx = useCombatFxStore.getState()
          reportEnemyDeath(entry.position, config.burstColor)
          fx.spawnOrbs(entry.position, ORB_DROPS_MIN + Math.floor(Math.random() * ORB_DROPS_RANDOM) + (elite ? ELITE.drops * 2 : 0))
          useWorldProgressStore.getState().markMonsterDefeated(id, config.respawnDelayMs)
          useQuestStore.getState().reportDefeat(config.kind)
          useStatsStore.getState().gainExp(exp)
          useInventoryStore.getState().addItem(config.dropItem, elite ? ELITE.drops : 1)
          useAudioStore.getState().playSound('monsterDeath')
          useToastStore.getState().push(`${elite ? '정예 ' : ''}${config.name}을(를) 처치했습니다 (+${exp} EXP)`)
          setIsDead(true)
        }
      },
    }
    registryEntry.current = entry
    registerMonster(id, entry)
    return () => unregisterMonster(id)
  }, [id, spawnPosition, isDead, elite, maxHealth, config])

  useFrame((_, delta) => {
    if (isDead) {
      const respawnAt = useWorldProgressStore.getState().monsterRespawnAt[id]
      if (respawnAt && Date.now() >= respawnAt) {
        const nextElite = rollElite()
        health.current = config.maxHealth * (nextElite ? ELITE.health : 1)
        state.current = STATE.IDLE
        reaction.current = createHitReaction()
        wanderTarget.current = [spawnPosition[0], spawnPosition[2]]
        setElite(nextElite)
        setIsDead(false)
      }
      return
    }

    if (!groupRef.current) return

    const group = groupRef.current
    const pos = group.position
    const r = reaction.current
    let hop = 0

    const settle = () => {
      pos.y = terrainHeightAt(pos.x, pos.z) + halfHeight + r.air + hop
      if (registryEntry.current) registryEntry.current.position = [pos.x, pos.y, pos.z]
    }

    if (warnRef.current) warnRef.current.style.opacity = state.current === STATE.WINDUP ? '1' : '0'

    if (stepHitReaction(r, group, delta)) {
      settle()
      return
    }

    const { position: playerPos } = usePlayerStore.getState()
    const dx = playerPos[0] - pos.x
    const dz = playerPos[2] - pos.z
    const distToPlayer = Math.hypot(dx, dz)
    const speed = config.speed * (elite ? ELITE.speed : 1)

    const villageDist = Math.hypot(pos.x - VILLAGE_CENTER[0], pos.z - VILLAGE_CENTER[1])
    const inSafeZone = villageDist < VILLAGE_SAFE_RADIUS
    const busy = state.current === STATE.WINDUP || state.current === STATE.LUNGE || state.current === STATE.RECOVER

    if (inSafeZone && state.current !== STATE.LUNGE) {
      // The village is a no-aggro safe zone - never chase/attack here, and
      // gently drift back out in case wandering pulled the monster in.
      state.current = STATE.IDLE
      const pushX = villageDist > 0.01 ? (pos.x - VILLAGE_CENTER[0]) / villageDist : 1
      const pushZ = villageDist > 0.01 ? (pos.z - VILLAGE_CENTER[1]) / villageDist : 0
      pos.x += pushX * config.wanderSpeed * delta
      pos.z += pushZ * config.wanderSpeed * delta
    } else if (!busy) {
      if (distToPlayer < config.attackRange * bodyScale) {
        state.current = STATE.WINDUP
        stateTimer.current = config.windup
        useAudioStore.getState().playSound('enemyWarn')
      } else if (distToPlayer < config.detectRange) state.current = STATE.CHASE
      else state.current = STATE.IDLE
    }

    if (state.current === STATE.WINDUP) {
      stateTimer.current -= delta
      const progress = 1 - stateTimer.current / config.windup
      if (progress < WINDUP_TRACKING_RATIO && distToPlayer > 0.01) {
        lungeDir.current = [dx / distToPlayer, dz / distToPlayer]
        group.rotation.y = Math.atan2(dx, dz)
      }
      // Crouch and shiver harder as the attack gets closer to firing.
      const crouch = 1 - progress * 0.25
      group.scale.set(group.scale.x * (2 - crouch), group.scale.y * crouch, group.scale.z * (2 - crouch))
      pos.x += (Math.random() - 0.5) * progress * 0.06
      if (stateTimer.current <= 0) {
        state.current = STATE.LUNGE
        stateTimer.current = config.lungeDuration
        lungeHit.current = false
      }
    } else if (state.current === STATE.LUNGE) {
      stateTimer.current -= delta
      const progress = 1 - stateTimer.current / config.lungeDuration
      pos.x += lungeDir.current[0] * config.lungeSpeed * delta
      pos.z += lungeDir.current[1] * config.lungeSpeed * delta
      hop = Math.sin(Math.min(1, progress) * Math.PI) * config.lungeHop
      if (!lungeHit.current && distToPlayer < config.attackRange * LUNGE_HIT_RADIUS_RATIO * bodyScale) {
        lungeHit.current = true
        useStatsStore.getState().takeDamage(Math.round(config.attackDamage * (elite ? ELITE.damage : 1)))
      }
      if (stateTimer.current <= 0) {
        state.current = STATE.RECOVER
        stateTimer.current = config.recover
      }
    } else if (state.current === STATE.RECOVER) {
      stateTimer.current -= delta
      if (stateTimer.current <= 0) state.current = STATE.CHASE
    } else if (state.current === STATE.CHASE) {
      pos.x += (dx / distToPlayer) * speed * delta
      pos.z += (dz / distToPlayer) * speed * delta
      group.rotation.y = Math.atan2(dx, dz)
    } else {
      const tx = wanderTarget.current[0] - pos.x
      const tz = wanderTarget.current[1] - pos.z
      const distToTarget = Math.hypot(tx, tz)

      idleTimer.current -= delta
      if (distToTarget < 0.5 || idleTimer.current <= 0) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * config.wanderRadius
        wanderTarget.current = [
          spawnPosition[0] + Math.cos(angle) * radius,
          spawnPosition[2] + Math.sin(angle) * radius,
        ]
        idleTimer.current = 2 + Math.random() * 3
      } else if (distToTarget > 0.01) {
        pos.x += (tx / distToTarget) * config.wanderSpeed * delta
        pos.z += (tz / distToTarget) * config.wanderSpeed * delta
        group.rotation.y = Math.atan2(tx, tz)
      }
    }

    settle()
  })

  if (isDead) return null

  return (
    <group ref={groupRef} position={spawnPosition}>
      <group ref={bodyRef} scale={bodyScale}>
        {children}
      </group>
      {elite && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -halfHeight + 0.03, 0]}>
          <ringGeometry args={[0.55 * bodyScale, 0.7 * bodyScale, 32]} />
          <meshBasicMaterial color={ELITE_TINT} transparent opacity={0.7} />
        </mesh>
      )}
      <Html position={[0, config.hpBarHeight * bodyScale, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className="enemy-tag">
          <div ref={warnRef} className="enemy-warn">!</div>
          {elite && <div className="enemy-elite">★ 정예</div>}
          <div ref={hpBarRef} className="enemy-hp" style={{ opacity: elite ? 1 : 0 }}>
            <div ref={hpFillRef} className="enemy-hp__fill" />
          </div>
        </div>
      </Html>
    </group>
  )
}
