import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sky, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useWorldStore } from '../../store/useWorldStore'

const SUN_DISTANCE = 300

const DAY_COLOR = new THREE.Color('#fff4e0')
const SUNSET_COLOR = new THREE.Color('#ff9a55')
const NIGHT_COLOR = new THREE.Color('#3a4a7a')

function clamp01(v) {
  return Math.max(0, Math.min(1, v))
}

export default function DayNightCycle() {
  const skyRef = useRef()
  const sunRef = useRef()
  const ambientRef = useRef()
  const sunVector = useRef(new THREE.Vector3())
  const tintColor = useRef(new THREE.Color())
  const [isNight, setIsNight] = useState(false)

  useFrame((_, delta) => {
    useWorldStore.getState().advanceTime(delta)
    const { timeOfDay } = useWorldStore.getState()

    const angle = timeOfDay * Math.PI * 2 - Math.PI / 2
    const sunHeight = Math.sin(angle)
    const sunHorizontal = Math.cos(angle)

    sunVector.current.set(sunHorizontal, sunHeight, 0.35).normalize()

    if (skyRef.current) {
      skyRef.current.material.uniforms.sunPosition.value.copy(sunVector.current)
    }

    if (sunRef.current) {
      sunRef.current.position.copy(sunVector.current).multiplyScalar(SUN_DISTANCE)
      sunRef.current.intensity = Math.max(0.05, clamp01(sunHeight + 0.15)) * 1.4

      if (sunHeight > 0.3) {
        tintColor.current.copy(DAY_COLOR)
      } else if (sunHeight > 0) {
        tintColor.current.copy(SUNSET_COLOR).lerp(DAY_COLOR, sunHeight / 0.3)
      } else {
        tintColor.current.copy(NIGHT_COLOR).lerp(SUNSET_COLOR, clamp01(1 + sunHeight / 0.2))
      }
      sunRef.current.color.copy(tintColor.current)
    }

    if (ambientRef.current) {
      ambientRef.current.intensity = 0.15 + 0.45 * clamp01(sunHeight)
    }

    const nightNow = sunHeight < 0.05
    if (nightNow !== isNight) setIsNight(nightNow)
  })

  return (
    <>
      <Sky ref={skyRef} turbidity={6} rayleigh={1} mieCoefficient={0.005} mieDirectionalG={0.8} />
      {isNight && <Stars radius={200} depth={60} count={3000} factor={4} fade speed={0.5} />}
      <ambientLight ref={ambientRef} intensity={0.3} />
      <directionalLight
        ref={sunRef}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-camera-far={500}
      />
    </>
  )
}
