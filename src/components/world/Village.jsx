import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useBox, useCylinder } from '@react-three/cannon'
import { useWorldStore } from '../../store/useWorldStore'
import Villager from './Villager'
import {
  VILLAGE_HOUSES,
  VILLAGE_WELL_POSITION,
  VILLAGE_LAMPS,
  VILLAGE_FENCE_POSTS,
  VILLAGER_ANCHORS,
} from '../../utils/villageLayout'

function House({ position, rotationY, width, depth, height, color, roofColor }) {
  const bodyPosition = [position[0], position[1] + height / 2, position[2]]
  const [bodyRef] = useBox(() => ({
    type: 'Static',
    position: bodyPosition,
    rotation: [0, rotationY, 0],
    args: [width, height, depth],
  }))

  const roofHeight = 1.7
  const roofRadius = Math.hypot(width, depth) * 0.42

  return (
    <mesh ref={bodyRef} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={color} roughness={0.9} />

      <mesh castShadow position={[0, height / 2 + roofHeight / 2 - 0.1, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[roofRadius, roofHeight, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.85} />
      </mesh>

      <mesh position={[0, -height / 2 + 0.75, depth / 2 + 0.01]}>
        <planeGeometry args={[0.85, 1.5]} />
        <meshStandardMaterial color="#3a2a1c" />
      </mesh>

      <mesh position={[width / 2 - 0.4, 0.1, depth / 2 + 0.01]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial color="#ffe9a8" emissive="#ffcf6b" emissiveIntensity={0.5} />
      </mesh>
    </mesh>
  )
}

function Well({ position }) {
  const [ref] = useCylinder(() => ({
    type: 'Static',
    position: [position[0], position[1] + 0.5, position[2]],
    args: [0.9, 0.9, 1, 12],
  }))

  return (
    <group>
      <mesh ref={ref} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 0.9, 1, 12]} />
        <meshStandardMaterial color="#8f8a80" roughness={0.9} />
      </mesh>
      <mesh position={[position[0], position[1] + 0.3, position[2]]}>
        <cylinderGeometry args={[0.75, 0.75, 0.1, 12]} />
        <meshStandardMaterial color="#2a4f66" roughness={0.4} />
      </mesh>
      {[-0.6, 0.6].map((offset) => (
        <mesh key={offset} position={[position[0] + offset, position[1] + 1.3, position[2]]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.6, 6]} />
          <meshStandardMaterial color="#5c4530" />
        </mesh>
      ))}
      <mesh position={[position[0], position[1] + 2.15, position[2]]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1, 0.6, 4]} />
        <meshStandardMaterial color="#6f3527" roughness={0.85} />
      </mesh>
    </group>
  )
}

function Lamp({ position }) {
  const bulbRef = useRef()
  const lightRef = useRef()

  useFrame(() => {
    const { timeOfDay } = useWorldStore.getState()
    const angle = timeOfDay * Math.PI * 2 - Math.PI / 2
    const sunHeight = Math.sin(angle)
    const lit = sunHeight < 0.1
    const intensity = lit ? 1 : 0.1
    if (bulbRef.current) bulbRef.current.material.emissiveIntensity = lit ? 1.4 : 0.15
    if (lightRef.current) lightRef.current.intensity = lit ? intensity : 0
  })

  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 2, 6]} />
        <meshStandardMaterial color="#3f3a33" />
      </mesh>
      <mesh ref={bulbRef} position={[0, 2.05, 0]}>
        <sphereGeometry args={[0.16, 8, 8]} />
        <meshStandardMaterial color="#ffdd88" emissive="#ffb547" emissiveIntensity={0.15} transparent opacity={0.95} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 2.05, 0]} color="#ffb547" intensity={0} distance={9} decay={2} />
    </group>
  )
}

function FencePost({ position }) {
  return (
    <mesh position={[position[0], position[1] + 0.5, position[2]]} castShadow receiveShadow>
      <cylinderGeometry args={[0.07, 0.09, 1, 6]} />
      <meshStandardMaterial color="#5c4530" roughness={0.9} />
    </mesh>
  )
}

export default function Village() {
  return (
    <>
      {VILLAGE_HOUSES.map((house, i) => (
        <House key={`house-${i}`} {...house} />
      ))}
      <Well position={VILLAGE_WELL_POSITION} />
      {VILLAGE_LAMPS.map((position, i) => (
        <Lamp key={`lamp-${i}`} position={position} />
      ))}
      {VILLAGE_FENCE_POSTS.map((position, i) => (
        <FencePost key={`fence-${i}`} position={position} />
      ))}
      {VILLAGER_ANCHORS.map((anchor, i) => (
        <Villager key={`villager-${i}`} anchor={anchor} />
      ))}
    </>
  )
}
