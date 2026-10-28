import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { cameraShake, cameraFov } from '../../store/useCombatFxStore'

const MAX_OFFSET = 0.35
const TRAUMA_DECAY_PER_SEC = 1.8
const BASE_FOV = 60
const FOV_EASE = 6

// Trauma-based shake: offset scales with trauma squared so small bumps stay
// subtle while big hits really kick. The offset is removed again before
// OrbitControls updates (priority -1 in drei), so the controls never see it
// and the player's chosen orbit angle/zoom doesn't drift.
export default function CameraShake() {
  const applied = useRef(new THREE.Vector3()).current

  useFrame(({ camera }) => {
    camera.position.sub(applied)
    applied.set(0, 0, 0)
  }, -2)

  useFrame(({ camera, clock }, delta) => {
    // Ease toward the requested FOV kick (sprint widens, charging narrows).
    const targetFov = BASE_FOV + cameraFov.boost
    if (Math.abs(camera.fov - targetFov) > 0.01) {
      camera.fov += (targetFov - camera.fov) * Math.min(1, FOV_EASE * delta)
      camera.updateProjectionMatrix()
    }

    if (cameraShake.trauma <= 0) return
    const shake = cameraShake.trauma * cameraShake.trauma * MAX_OFFSET
    const t = clock.elapsedTime * 40
    applied.set(Math.sin(t * 1.1) * shake, Math.sin(t * 1.7 + 1.3) * shake, Math.sin(t * 1.3 + 2.1) * shake)
    camera.position.add(applied)
    cameraShake.trauma = Math.max(0, cameraShake.trauma - TRAUMA_DECAY_PER_SEC * delta)
  })

  return null
}
