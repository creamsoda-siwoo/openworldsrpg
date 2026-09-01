import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { ITEMS } from '../../data/items'
import SwordMesh from './SwordMesh'
import BowMesh from './BowMesh'

const MODEL_URL = '/models/CesiumMan.glb'
const TARGET_HEIGHT = 1.6
// CesiumMan's rest pose faces this way by default - rotate the whole rig so
// it matches our world convention (heading 0 = facing +Z).
const FACING_OFFSET = Math.PI

const ATTACK_SWING_DURATION = 0.32

// This model ships a single walk clip with no attack/idle pose, and it's
// frozen wherever the paused clip happens to land - sometimes with the hand
// down near the leg. Rather than fight that, weapons hang at a fixed spot at
// the character's side (same rotated frame as the body) instead of tracking
// the actual hand bone, so they always read clearly regardless of the arm's
// current pose.
const WEAPON_ANCHOR = [0.34, 1.05, 0.06]

export default function HumanCharacter({ speedRef, walkSpeedReference = 2.5, equippedWeaponId, attackSignal }) {
  const { scene, animations } = useGLTF(MODEL_URL)
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const mixerRef = useRef()
  const actionRef = useRef()
  const weaponGroupRef = useRef()
  const swingState = useRef({ active: false, elapsed: 0 })
  const lastAttackSignal = useRef(attackSignal)

  const scale = useMemo(() => {
    // The clone's matrixWorld isn't populated until it's part of a rendered
    // scene graph, so a Box3 taken right after cloning would measure against
    // stale (often identity) world matrices - force an update first.
    clonedScene.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(clonedScene)
    const height = box.max.y - box.min.y || 1
    return TARGET_HEIGHT / height
  }, [clonedScene])

  useEffect(() => {
    const mixer = new THREE.AnimationMixer(clonedScene)
    const action = mixer.clipAction(animations[0])
    action.play()
    action.paused = true
    mixerRef.current = mixer
    actionRef.current = action
    return () => mixer.stopAllAction()
  }, [clonedScene, animations])

  useFrame((_, delta) => {
    const action = actionRef.current
    if (action) {
      const speed = speedRef?.current ?? 0
      const walking = speed > 0.05
      action.paused = !walking
      if (walking) {
        action.timeScale = THREE.MathUtils.clamp(speed / walkSpeedReference, 0.6, 1.8)
      }
      mixerRef.current.update(delta)
    }

    if (attackSignal !== undefined && attackSignal !== lastAttackSignal.current) {
      lastAttackSignal.current = attackSignal
      swingState.current = { active: true, elapsed: 0 }
    }

    if (!weaponGroupRef.current) return

    let swing = 0
    if (swingState.current.active) {
      swingState.current.elapsed += delta
      const t = Math.min(1, swingState.current.elapsed / ATTACK_SWING_DURATION)
      swing = Math.sin(t * Math.PI)
      if (t >= 1) swingState.current.active = false
    }

    const isRanged = equippedWeaponId && ITEMS[equippedWeaponId]?.attackType === 'ranged'
    if (isRanged) {
      weaponGroupRef.current.rotation.set(swing * 0.5, 0, swing * 0.7)
    } else {
      // Slash left-right (Z) rather than forward-back (X) - from a
      // behind-the-character camera a Z swing reads as a clear side-to-side
      // arc instead of foreshortening toward/away from the view.
      weaponGroupRef.current.rotation.set(0, 0, -swing * 2.2)
    }
  })

  const isMelee = equippedWeaponId && ITEMS[equippedWeaponId]?.attackType === 'melee'
  const isRanged = equippedWeaponId && ITEMS[equippedWeaponId]?.attackType === 'ranged'

  return (
    <>
      <primitive object={clonedScene} scale={scale} rotation={[0, FACING_OFFSET, 0]} />
      {(isMelee || isRanged) && (
        <group position={WEAPON_ANCHOR} rotation={[0, FACING_OFFSET, 0]}>
          <group ref={weaponGroupRef}>
            {isMelee && <SwordMesh />}
            {isRanged && <BowMesh />}
          </group>
        </group>
      )}
    </>
  )
}

useGLTF.preload(MODEL_URL)
