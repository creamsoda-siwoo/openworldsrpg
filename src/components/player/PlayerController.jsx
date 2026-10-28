import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSphere, useContactMaterial } from '@react-three/cannon'
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
import { useCombatFxStore, addShake, cameraFov, playerCharge } from '../../store/useCombatFxStore'
import { terrainHeightAt } from '../../utils/terrain'
import { ITEMS, UNARMED_DAMAGE, UNARMED_RANGE } from '../../data/items'

const MOVE_SPEED = 5
const JUMP_VELOCITY = 6
const PLAYER_RADIUS = 0.5
// How close the sphere needs to rest to the ground surface to count as
// "grounded" for jump purposes. cannon-es only fires its 'collide' event on
// the step a contact begins (it stays silent for the rest of a resting
// contact - see onCollideEnd never firing while parked on flat ground), so
// contact events alone can't drive this; comparing the physics body's own
// settled height against the surface it's colliding with is the reliable
// signal.
const GROUND_CHECK_TOLERANCE = 0.15

// Short ramp-up/down on horizontal speed so starts, stops and direction
// changes feel weighty instead of snapping, while staying responsive.
const GROUND_ACCEL = 18
const AIR_ACCEL = 7
const TURN_SPEED = 16

// Jump forgiveness: a press slightly before landing still jumps (buffer), and
// so does one just after walking off a ledge (coyote time).
const JUMP_BUFFER = 0.15
const COYOTE_TIME = 0.12

// Camera follow: horizontal tracking is tight, vertical is softer so jumps
// and bumpy terrain don't bob the view. A jump larger than the snap distance
// (warp, respawn) moves the camera instantly instead of sliding across.
const CAMERA_FOLLOW_XZ = 20
const CAMERA_FOLLOW_Y = 7
const CAMERA_SNAP_DISTANCE = 10
const CAMERA_TARGET_HEIGHT = 0.6

const MELEE_ATTACK_COOLDOWN = 0.5
const RANGED_ATTACK_COOLDOWN = 0.7
const ATTACK_STAMINA_COST = 15
const STAMINA_REGEN_PER_SEC = 12

// Dodge roll: a short burst of speed with invulnerability frames. Getting hit
// mid-roll counts as a perfect dodge (see useStatsStore.takeDamage).
const DODGE_DURATION = 0.4
const DODGE_SPEED = 13
const DODGE_COOLDOWN = 0.25
const DODGE_STAMINA_COST = 20
// Height above the physics sphere's center to spin the model around, roughly
// the character's waist, so the roll tumbles in place instead of orbiting
// around the feet.
const ROLL_PIVOT_HEIGHT = 0.3

// Holding Shift past the roll keeps you sprinting while stamina lasts.
const SPRINT_SPEED = 8.5
const SPRINT_STAMINA_PER_SEC = 18

const DOUBLE_JUMP_VELOCITY = 6.5
const FLIP_DURATION = 0.45

// Hold the attack button after a swing to charge a heavy attack: a launching
// spin slash with a sword/fists, a piercing five-arrow fan with a bow. The
// short delay keeps quick taps from flashing the charge ring.
const CHARGE_DELAY = 0.15
const CHARGE_TIME = 0.6
const CHARGE_MOVE_SCALE = 0.5
const CHARGED_STAMINA_COST = 30
const CHARGED_DAMAGE_MULTIPLIER = 2.5
const CHARGED_RANGE_MULTIPLIER = 1.8
const CHARGED_ARROW_COUNT = 5
const CHARGED_ARROW_SPREAD = 0.35
const CHARGED_ARROW_DAMAGE_MULTIPLIER = 1.5
const SPIN_DURATION = 0.4

// Attacking with a melee weapon while high enough in the air turns into a
// plunge: slam straight down and launch everything around the landing spot.
const PLUNGE_MIN_HEIGHT = 1.2
const PLUNGE_VELOCITY = -22
const PLUNGE_RADIUS = 3.5
const PLUNGE_DAMAGE_MULTIPLIER = 2

// Falls faster than this kick up dust and bump the camera on landing.
const HARD_LANDING_VELOCITY = -7
const DUST_COLOR = '#b9a27a'

const FOV_SPRINT_BOOST = 12
const FOV_DODGE_BOOST = 8
const FOV_CHARGE_BOOST = -5

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
  const rollRef = useRef()
  const dodgeTime = useRef(0)
  const dodgeCooldown = useRef(0)
  const dodgeDir = useRef(new THREE.Vector3()).current
  const dodgeKeyWasDown = useRef(false)
  const sprintLocked = useRef(false)
  const jumpKeyWasDown = useRef(false)
  const doubleJumped = useRef(false)
  const flipTime = useRef(0)
  const spinTime = useRef(0)
  const chargeHeld = useRef(false)
  const chargeTime = useRef(0)
  const chargeReadyPlayed = useRef(false)
  const plunging = useRef(false)
  const grounded = useRef(true)
  const fallSpeed = useRef(0)
  const horizontalVelocity = useRef(new THREE.Vector2()).current
  const jumpBuffer = useRef(0)
  const coyoteTimer = useRef(0)
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
    material: 'player',
  }))

  // High friction against the ground so slopes are climbable and the player
  // doesn't slide; obstacles (trees/rocks/houses) stay at the Physics
  // component's frictionless default so the player doesn't snag on them.
  useContactMaterial('player', 'ground', { friction: 0.9, restitution: 0 })

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
  const desiredTarget = useRef(new THREE.Vector3()).current

  // Radius check (no frontal-facing cone) - the player's model only turns to
  // face its last movement direction, so once it stops next to a monster that
  // approached from the side or behind, a facing-cone check would make melee
  // whiff for no visible reason.
  const hitEnemiesInRadius = (radius, baseDamage, { launch = false } = {}) => {
    const [px, , pz] = position.current
    const { monsters } = useMonsterRegistry.getState()
    const fx = useCombatFxStore.getState()
    let landed = false
    Object.values(monsters).forEach((monster) => {
      const dist = Math.hypot(monster.position[0] - px, monster.position[2] - pz)
      if (dist > radius) return
      const roll = fx.rollDamage(baseDamage)
      monster.hit(roll.damage, { crit: roll.crit, launch, from: position.current })
      landed = true
    })
    if (landed) fx.registerComboHit()
    return landed
  }

  const performAttack = (charged = false) => {
    if (dodgeTime.current > 0 || plunging.current) return
    if (!charged && attackCooldown.current > 0) return

    const equippedId = useInventoryStore.getState().equippedWeaponId
    const weapon = equippedId ? ITEMS[equippedId] : null
    const isRanged = weapon?.attackType === 'ranged'
    const damage = weapon ? weapon.damage : UNARMED_DAMAGE
    const range = weapon?.range ?? UNARMED_RANGE
    const [px, py, pz] = position.current
    const fx = useCombatFxStore.getState()

    const heightAboveGround = py - PLAYER_RADIUS - terrainHeightAt(px, pz)
    const plunge = !charged && !isRanged && !grounded.current && heightAboveGround > PLUNGE_MIN_HEIGHT

    const cost = charged ? CHARGED_STAMINA_COST : ATTACK_STAMINA_COST
    if (!useStatsStore.getState().consumeStamina(cost)) return

    attackCooldown.current = isRanged ? RANGED_ATTACK_COOLDOWN : MELEE_ATTACK_COOLDOWN
    useAudioStore.getState().playSound(charged || plunge ? 'heavy' : 'attack')
    setAttackSignal((n) => n + 1)

    if (plunge) {
      plunging.current = true
      return
    }

    if (isRanged) {
      // Aim with the camera's current look direction and snap the character
      // to face it, since arrows travel rather than hitting an area.
      const aim = Math.atan2(camForward.x, camForward.z)
      if (modelRef.current) modelRef.current.rotation.y = aim
      const origin = [px, py + 0.9, pz]
      if (charged) {
        for (let i = 0; i < CHARGED_ARROW_COUNT; i++) {
          const angle = aim + (i / (CHARGED_ARROW_COUNT - 1) - 0.5) * 2 * CHARGED_ARROW_SPREAD
          useProjectileStore
            .getState()
            .spawnArrow(origin, [Math.sin(angle), Math.cos(angle)], damage * CHARGED_ARROW_DAMAGE_MULTIPLIER, { pierce: true })
        }
        addShake(0.2)
      } else {
        useProjectileStore.getState().spawnArrow(origin, [camForward.x, camForward.z], damage)
      }
    } else if (charged) {
      const radius = range * CHARGED_RANGE_MULTIPLIER
      spinTime.current = SPIN_DURATION
      fx.spawnShockwave([px, py - PLAYER_RADIUS, pz], radius, '#ffe7a3')
      hitEnemiesInRadius(radius, damage * CHARGED_DAMAGE_MULTIPLIER, { launch: true })
      addShake(0.4)
    } else {
      hitEnemiesInRadius(range, damage)
    }
  }

  const resetCharge = () => {
    chargeHeld.current = false
    chargeTime.current = 0
    chargeReadyPlayed.current = false
    playerCharge.value = 0
  }

  // Taps attack immediately on press; keeping the button held afterwards
  // charges the heavy attack, which fires on release once fully charged.
  useEffect(() => {
    const onMouseDown = (event) => {
      if (event.button !== 0) return
      if (useUIStore.getState().isBlockingInput()) return
      performAttack()
      chargeHeld.current = true
      chargeTime.current = 0
    }
    const onMouseUp = (event) => {
      if (event.button !== 0) return
      const ready = chargeHeld.current && playerCharge.value >= 1
      resetCharge()
      if (ready && !useUIStore.getState().isBlockingInput()) performAttack(true)
    }
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  useFrame((state, delta) => {
    if (attackCooldown.current > 0) attackCooldown.current -= delta
    if (dodgeCooldown.current > 0) dodgeCooldown.current -= delta

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
      horizontalVelocity.set(0, 0)
      useWarpStore.getState().clearWarpRequest()
      useAudioStore.getState().playSound('uiClose')
      useToastStore.getState().push('이동했습니다.')
    }

    const uiBlocking = useUIStore.getState().isBlockingInput() || !useWorldProgressStore.getState().hasSeenIntro
    const { forward, backward, left, right, jump, dodge } = uiBlocking ? {} : keys.current

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

    // Heavy-attack charge. Dodging or opening a menu drops it.
    if (chargeHeld.current && (uiBlocking || dodgeTime.current > 0)) resetCharge()
    const charging = chargeHeld.current && chargeTime.current > CHARGE_DELAY
    if (chargeHeld.current) {
      chargeTime.current += delta
      playerCharge.value = Math.min(1, Math.max(0, (chargeTime.current - CHARGE_DELAY) / CHARGE_TIME))
      if (playerCharge.value >= 1 && !chargeReadyPlayed.current) {
        chargeReadyPlayed.current = true
        useAudioStore.getState().playSound('chargeReady')
      }
    }

    // Sprint while Shift stays held after the roll. Running dry locks it
    // until Shift is released, so stamina gets a chance to come back.
    if (!dodge) sprintLocked.current = false
    let sprinting = false
    if (dodge && isMoving && dodgeTime.current <= 0 && !charging && !sprintLocked.current) {
      sprinting = useStatsStore.getState().consumeStamina(SPRINT_STAMINA_PER_SEC * delta)
      if (!sprinting) sprintLocked.current = true
    }
    if (!sprinting) useStatsStore.getState().regenStamina(STAMINA_REGEN_PER_SEC * delta)
    useCombatFxStore.getState().setSprinting(sprinting)

    let moveSpeed = MOVE_SPEED
    if (sprinting) moveSpeed = SPRINT_SPEED
    else if (charging) moveSpeed = MOVE_SPEED * CHARGE_MOVE_SCALE
    if (isMoving) {
      moveDirection.normalize().multiplyScalar(moveSpeed)
    }
    speedRef.current = isMoving ? moveSpeed : 0

    // Dodge triggers on the key's press edge so holding Shift doesn't chain
    // rolls. Rolls toward the movement input, or forward when standing still.
    const dodgePressed = dodge && !dodgeKeyWasDown.current
    dodgeKeyWasDown.current = !!dodge
    if (
      dodgePressed &&
      dodgeTime.current <= 0 &&
      dodgeCooldown.current <= 0 &&
      useStatsStore.getState().consumeStamina(DODGE_STAMINA_COST)
    ) {
      const heading = modelRef.current ? modelRef.current.rotation.y : 0
      if (isMoving) dodgeDir.copy(moveDirection).normalize()
      else dodgeDir.set(Math.sin(heading), 0, Math.cos(heading))
      dodgeTime.current = DODGE_DURATION
      dodgeCooldown.current = DODGE_DURATION + DODGE_COOLDOWN
      useCombatFxStore.getState().setInvulnerable(DODGE_DURATION)
      useAudioStore.getState().playSound('dodge')
      if (modelRef.current) modelRef.current.rotation.y = Math.atan2(dodgeDir.x, dodgeDir.z)
    }

    const dodging = dodgeTime.current > 0
    if (dodging) {
      dodgeTime.current -= delta
      const progress = 1 - Math.max(0, dodgeTime.current) / DODGE_DURATION
      // Ease out so the roll launches hard and settles into the next step.
      moveDirection.copy(dodgeDir).multiplyScalar(DODGE_SPEED * (1 - progress * 0.7))
      speedRef.current = 0
      if (rollRef.current) rollRef.current.rotation.x = progress * Math.PI * 2
    } else if (flipTime.current > 0) {
      flipTime.current -= delta
      const progress = 1 - Math.max(0, flipTime.current) / FLIP_DURATION
      if (rollRef.current) rollRef.current.rotation.x = progress * Math.PI * 2
    } else if (rollRef.current) {
      rollRef.current.rotation.x = 0
    }

    if (spinTime.current > 0) {
      spinTime.current -= delta
      if (modelRef.current) modelRef.current.rotation.y += (Math.PI * 2 * delta) / SPIN_DURATION
    }

    // Position and velocity are now fully owned by the physics engine - the
    // sphere rests on and climbs slopes via real contact/friction resolution
    // against the terrain heightfield (see Terrain.jsx) instead of being
    // snapped there every frame. "Grounded" just gates when a jump impulse
    // is allowed, using the settled height as the signal (see the
    // GROUND_CHECK_TOLERANCE comment above for why events aren't used here).
    const groundHeight = terrainHeightAt(position.current[0], position.current[2])
    const wasGrounded = grounded.current
    grounded.current =
      position.current[1] - PLAYER_RADIUS - groundHeight < GROUND_CHECK_TOLERANCE && velocity.current[1] <= 0.1

    if (!grounded.current) fallSpeed.current = Math.min(fallSpeed.current, velocity.current[1])

    if (grounded.current && !wasGrounded) {
      const [lx, ly, lz] = position.current
      const feet = [lx, ly - PLAYER_RADIUS, lz]
      const fx = useCombatFxStore.getState()
      if (plunging.current) {
        const equippedId = useInventoryStore.getState().equippedWeaponId
        const baseDamage = equippedId ? ITEMS[equippedId].damage : UNARMED_DAMAGE
        hitEnemiesInRadius(PLUNGE_RADIUS, baseDamage * PLUNGE_DAMAGE_MULTIPLIER, { launch: true })
        fx.spawnShockwave(feet, PLUNGE_RADIUS, '#ffd27f')
        fx.spawnBurst(feet, DUST_COLOR, 20)
        useAudioStore.getState().playSound('slam')
        addShake(0.6)
      } else if (fallSpeed.current < HARD_LANDING_VELOCITY) {
        fx.spawnBurst(feet, DUST_COLOR, 8)
        useAudioStore.getState().playSound('land')
        addShake(0.12)
      }
      plunging.current = false
      fallSpeed.current = 0
      doubleJumped.current = false
    }

    const jumpPressed = jump && !jumpKeyWasDown.current
    jumpKeyWasDown.current = !!jump
    if (jumpPressed) jumpBuffer.current = JUMP_BUFFER
    else if (jumpBuffer.current > 0) jumpBuffer.current -= delta
    if (grounded.current) coyoteTimer.current = COYOTE_TIME
    else if (coyoteTimer.current > 0) coyoteTimer.current -= delta

    let nextVy = velocity.current[1]
    const canGroundJump = grounded.current || coyoteTimer.current > 0
    if (canGroundJump && jumpBuffer.current > 0 && !dodging) {
      jumpBuffer.current = 0
      coyoteTimer.current = 0
      useAudioStore.getState().playSound('jump')
      nextVy = JUMP_VELOCITY
    } else if (!canGroundJump && jumpPressed && !doubleJumped.current && !dodging && !plunging.current) {
      jumpBuffer.current = 0
      doubleJumped.current = true
      flipTime.current = FLIP_DURATION
      useAudioStore.getState().playSound('doubleJump')
      nextVy = DOUBLE_JUMP_VELOCITY
    }
    if (plunging.current) {
      nextVy = PLUNGE_VELOCITY
      moveDirection.set(0, 0, 0)
    }

    // Dodges and plunges set their velocity outright; normal movement eases
    // toward the input.
    if (dodging || plunging.current) {
      horizontalVelocity.set(moveDirection.x, moveDirection.z)
    } else {
      const accel = grounded.current ? GROUND_ACCEL : AIR_ACCEL
      const t = 1 - Math.exp(-accel * delta)
      horizontalVelocity.x += (moveDirection.x - horizontalVelocity.x) * t
      horizontalVelocity.y += (moveDirection.z - horizontalVelocity.y) * t
    }

    api.velocity.set(horizontalVelocity.x, nextVy, horizontalVelocity.y)

    // Rotate the visual model to face movement direction
    if (isMoving && !dodging && spinTime.current <= 0 && modelRef.current) {
      const targetAngle = Math.atan2(moveDirection.x, moveDirection.z)
      const currentAngle = modelRef.current.rotation.y
      let angleDiff = targetAngle - currentAngle
      angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff))
      modelRef.current.rotation.y = currentAngle + angleDiff * (1 - Math.exp(-TURN_SPEED * delta))
    }

    // Translate the camera together with the player. OrbitControls.target only
    // acts as a pivot point for user-driven orbit/zoom - simply moving it does
    // not move the camera itself, so without this the camera stays put while
    // rotating to keep looking at the player, which then feeds back into
    // camForward and curves the movement direction. Applying the same delta to
    // the camera position keeps the user's chosen orbit angle/zoom intact.
    if (controlsRef.current) {
      desiredTarget.set(position.current[0], position.current[1] + CAMERA_TARGET_HEIGHT, position.current[2])
      const prev = previousTarget.current
      const newTarget = prev.clone()
      if (newTarget.distanceTo(desiredTarget) > CAMERA_SNAP_DISTANCE) {
        newTarget.copy(desiredTarget)
      } else {
        const tXZ = 1 - Math.exp(-CAMERA_FOLLOW_XZ * delta)
        const tY = 1 - Math.exp(-CAMERA_FOLLOW_Y * delta)
        newTarget.x += (desiredTarget.x - newTarget.x) * tXZ
        newTarget.z += (desiredTarget.z - newTarget.z) * tXZ
        newTarget.y += (desiredTarget.y - newTarget.y) * tY
      }
      state.camera.position.add(newTarget.clone().sub(prev))
      controlsRef.current.target.copy(newTarget)
      prev.copy(newTarget)
    }

    if (sprinting) cameraFov.boost = FOV_SPRINT_BOOST
    else if (dodging) cameraFov.boost = FOV_DODGE_BOOST
    else if (charging) cameraFov.boost = FOV_CHARGE_BOOST
    else cameraFov.boost = 0

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
      horizontalVelocity.set(0, 0)
      useStatsStore.getState().respawn()
      useCombatFxStore.getState().resetCombo()
      plunging.current = false
      resetCharge()
      useAudioStore.getState().playSound('death')
      useToastStore.getState().push('쓰러졌습니다... 마을 근처에서 다시 눈을 뜹니다.')
    } else if (health > 0) {
      isDead.current = false
    }
  })

  return (
    <group ref={bodyRef}>
      <group ref={modelRef}>
        <group position={[0, ROLL_PIVOT_HEIGHT, 0]}>
          <group ref={rollRef}>
            <PlayerModel
              speedRef={speedRef}
              groundOffset={-PLAYER_RADIUS - ROLL_PIVOT_HEIGHT}
              equippedWeaponId={equippedWeaponId}
              attackSignal={attackSignal}
            />
          </group>
        </group>
      </group>
    </group>
  )
}
