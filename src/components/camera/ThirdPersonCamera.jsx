import { forwardRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// Left mouse button is reserved for attacking, so the camera orbits on the
// right button instead of the OrbitControls default.
const MOUSE_BUTTONS = { LEFT: undefined, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }

const ThirdPersonCamera = forwardRef(function ThirdPersonCamera(_, ref) {
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.15}
      minDistance={3}
      maxDistance={12}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.05}
      mouseButtons={MOUSE_BUTTONS}
    />
  )
})

export default ThirdPersonCamera
