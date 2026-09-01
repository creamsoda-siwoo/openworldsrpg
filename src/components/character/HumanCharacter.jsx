import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'

const MODEL_URL = '/models/CesiumMan.glb'
const TARGET_HEIGHT = 1.6
// CesiumMan's rest pose faces this way by default - rotate the whole rig so
// it matches our world convention (heading 0 = facing +Z).
const FACING_OFFSET = Math.PI

export default function HumanCharacter({ speedRef, walkSpeedReference = 2.5 }) {
  const { scene, animations } = useGLTF(MODEL_URL)
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const mixerRef = useRef()
  const actionRef = useRef()

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
    if (!action) return
    const speed = speedRef?.current ?? 0
    const walking = speed > 0.05
    action.paused = !walking
    if (walking) {
      action.timeScale = THREE.MathUtils.clamp(speed / walkSpeedReference, 0.6, 1.8)
    }
    mixerRef.current.update(delta)
  })

  return <primitive object={clonedScene} scale={scale} rotation={[0, FACING_OFFSET, 0]} />
}

useGLTF.preload(MODEL_URL)
