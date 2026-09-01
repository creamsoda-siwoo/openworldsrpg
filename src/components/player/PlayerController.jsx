import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSphere } from '@react-three/cannon'
import * as THREE from 'three'
import PlayerModel from './PlayerModel'
import useKeyboardControls from '../../hooks/useKeyboardControls'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useStatsStore } from '../../store/useStatsStore'
import { useUIStore } from '../../store/useUIStore'
import { useInventoryStore } from '../../store/useInventoryStore'
import { useMonsterRegistry } from '../../store/useMonsterRegistry'
import { useAudioStore } from '../../store/useAudioStore'
import { useToastStore } from '../../store/useToastStore'
import { useWarpStore } from '../../store/useWarpStore'
import { useWorldProgressStore } from '../../store/useWorldProgressStore'
import { useProjectileStore } from '../../store/useProjectileStore'
import { terrainHeightAt } from '../../utils/terrain'
import { ITEMS, UNARMED_DAMAGE, UNARMED_RANGE } from '../../data/items'

const MOVE_SPEED = 5
const JUMP_VELOCITY = 6
const PLAYER_RADIUS = 0.5
const GROUND_SNAP_TOLERANCE = 0.3

const MELEE_ATTACK_COOLDOWN = 0.5
const RANGED_ATTACK_COOLDOWN = 0.7
const ATTACK_STAMINA_COST = 15
const STAMINA_REGEN_PER_SEC = 12

const UP = new THREE.Vector3(0, 1, 0)

const DEFAULT_START_POSITION = [0, terrainHeightAt(0, 0) + 1.5, 0]

export default function PlayerController({ controlsRef, startPosition = DEFAULT_START_POSITION }) {
  const keys = useKeyboardControls()
  const modelRef = useRef()
  const velocity = useRef([0, 0, 0])
  const position = useRef(startPosition)
  const attackCooldown = useRef(0)
  const isDead = useRef(false)
  const speedRef = useRef(0)
  const [attackSignal, setAttackSignal] = useState(0)
  const [equippedWeaponId, setEquippedWeaponId] = useState(useInventoryStore.getState().equippedWeaponId)

  useEffect(() => useInventoryStore.subscribe((s) => setEquippedWeaponId(s.equippedWeaponId)), [])

  const [bodyRef, api] = useSphere(() => ({
    mass: 1,
    type: 'Dynamic',
    position: startPosition,
    args: [PLAYER_RADIUS],
    fixedRotation: true,
    linearDamping: 0.9,
    material: { friction: 0 },
  }))

  useEffect(() => {
    const unsubVelocity = api.velocity.subscribe((v) => (velocity.current = v))
    const unsubPosition = api.position.subscribe((p) => (position.current = p))
    return () => {
      unsubVelocity()
      unsubPosition()
    }
  }, [api])

  // Stable across re-renders (unlike a plain `const`) so the mousedown
  // listener registered once below always reads the vector that the active
  // useFrame callback is actually updating every frame, rather than a stale
  // instance frozen at whatever render first captured it.
  const camForward = useRef(new THREE.Vector3()).current
  const camRight = useRef(new THREE.Vector3()).current
  const moveDirection = useRef(new THREE.Vector3()).current
  const previousTarget = useRef(new THREE.Vector3(...startPosition))

  const performAttack = () => {
    if (attackCooldown.current > 0) return
    if (!useStatsStore.getState().consumeStamina(ATTACK_STAMINA_COST)) return

    const equippedId = useInventoryStore.getState().equippedWeaponId
    const weapon = equippedId ? ITEMS[equippedId] : null
    const isRanged = weapon?.attackType === 'ranged'
    const damage = weapon ? weapon.damage : UNARMED_DAMAGE

    attackCooldown.current = isRanged ? RANGED_ATTACK_COOLDOWN : MELEE_ATTACK_COOLDOWN
    useAudioStore.getState().playSound('attack')
    setAttackSignal((n) => n + 1)

    const [px, py, pz] = position.current

    if (isRanged) {
      // Aim with the camera's current look direction and snap the character
      // to face it, since arrows travel rather than hitting an area.
      if (modelRef.current) modelRef.current.rotation.y = Math.atan2(camForward.x, camForward.z)
      useProjectileStore.getState().spawnArrow([px, py + 0.9, pz], [camForward.x, camForward.z], damage)
    } else {
      const range = weapon?.range ?? UNARMED_RANGE
      // A plain radius check (no frontal-facing cone) - the player's model
      // only turns to face its last movement direction, so once it stops
      // next to a monster that approached from the side or behind, a
      // facing-cone check would make melee whiff for no visible reason.
      const { monsters } = useMonsterRegistry.getState()
      Object.values(monsters).forEach((monster) => {
        const dx = monster.position[0] - px
        const dz = monster.position[2] - pz
        const dist = Math.hypot(dx, dz)
        if (dist <= range) monster.hit(damage)
      })
    }
  }

  useEffect(() => {
    const onMouseDown = (event) => {
      if (event.button !== 0) return
      if (useUIStore.getState().isBlockingInput()) return
      performAttack()
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [])

  useFrame((state, delta) => {
    if (attackCooldown.current > 0) attackCooldown.current -= delta
    useStatsStore.getState().regenStamina(STAMINA_REGEN_PER_SEC * delta)

    const warpTarget = useWarpStore.getState().pendingWarpTarget
    if (warpTarget) {
      const [wx, wz] = warpTarget
      const wy = terrainHeightAt(wx, wz) + PLAYER_RADIUS + 0.5
      api.position.set(wx, wy, wz)
      api.velocity.set(0, 0, 0)
      // Update refs immediately so the rest of this frame (terrain-follow,
      // camera translation) reacts to the new spot instead of lagging one
      // frame behind the async physics subscription.
      position.current = [wx, wy, wz]
      velocity.current = [0, 0, 0]
      useWarpStore.getState().clearWarpRequest()
      useAudioStore.getState().playSound('uiClose')
      useToastStore.getState().push('이동했습니다.')
    }

    const uiBlocking = useUIStore.getState().isBlockingInput() || !useWorldProgressStore.getState().hasSeenIntro
    const { forward, backward, left, right, jump } = uiBlocking ? {} : keys.current

    // Movement direction relative to camera facing
    state.camera.getWorldDirection(camForward)
    camForward.y = 0
    camForward.normalize()
    camRight.crossVectors(camForward, UP).normalize()

    moveDirection.set(0, 0, 0)
    if (forward) moveDirection.add(camForward)
    if (backward) moveDirection.sub(camForward)
    if (right) moveDirection.add(camRight)
    if (left) moveDirection.sub(camRight)

    const isMoving = moveDirection.lengthSq() > 0
    if (isMoving) {
      moveDirection.normalize().multiplyScalar(MOVE_SPEED)
    }
    speedRef.current = isMoving ? MOVE_SPEED : 0

    // Follow the analytic terrain surface directly instead of relying on a
    // physics collider for the ground, so the player can walk any procedural
    // slope without a matching heightfield body.
    const terrainY = terrainHeightAt(position.current[0], position.current[2])
    const desiredY = terrainY + PLAYER_RADIUS
    const heightDiff = position.current[1] - desiredY
    const grounded = heightDiff <= GROUND_SNAP_TOLERANCE && velocity.current[1] <= 0.05

    let nextVy = velocity.current[1]
    if (grounded) {
      if (jump) useAudioStore.getState().playSound('jump')
      nextVy = jump ? JUMP_VELOCITY : 0
    }

    api.velocity.set(moveDirection.x, nextVy, moveDirection.z)

    if (grounded && !jump) {
      api.position.set(position.current[0], desiredY, position.current[2])
    }

    // Rotate the visual model to face movement direction
    if (isMoving && modelRef.current) {
      const targetAngle = Math.atan2(moveDirection.x, moveDirection.z)
      const currentAngle = modelRef.current.rotation.y
      let angleDiff = targetAngle - currentAngle
      angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff))
      modelRef.current.rotation.y = currentAngle + angleDiff * Math.min(1, 10 * delta)
    }

    // Translate the camera together with the player. OrbitControls.target only
    // acts as a pivot point for user-driven orbit/zoom - simply moving it does
    // not move the camera itself, so without this the camera stays put while
    // rotating to keep looking at the player, which then feeds back into
    // camForward and curves the movement direction. Applying the same delta to
    // the camera position keeps the user's chosen orbit angle/zoom intact.
    if (controlsRef.current) {
      const newTarget = new THREE.Vector3(...position.current)
      const delta = newTarget.clone().sub(previousTarget.current)
      state.camera.position.add(delta)
      controlsRef.current.target.copy(newTarget)
      previousTarget.current.copy(newTarget)
    }

    usePlayerStore.setState({
      position: [position.current[0], position.current[1], position.current[2]],
      heading: modelRef.current ? modelRef.current.rotation.y : 0,
    })

    // Respawn once health hits zero
    const { health } = useStatsStore.getState()
    if (health <= 0 && !isDead.current) {
      isDead.current = true
      api.position.set(...DEFAULT_START_POSITION)
      api.velocity.set(0, 0, 0)
      useStatsStore.getState().respawn()
      useAudioStore.getState().playSound('death')
      useToastStore.getState().push('쓰러졌습니다... 마을 근처에서 다시 눈을 뜹니다.')
    } else if (health > 0) {
      isDead.current = false
    }
  })

  return (
    <group ref={bodyRef}>
      <group ref={modelRef}>
        <PlayerModel
          speedRef={speedRef}
          groundOffset={-PLAYER_RADIUS}
          equippedWeaponId={equippedWeaponId}
          attackSignal={attackSignal}
        />
      </group>
    </group>
  )
}
