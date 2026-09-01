import { useCylinder, useSphere } from '@react-three/cannon'
import { SCENERY } from '../../utils/scenery'

function Tree({ position, scale }) {
  const trunkHeight = 1.6 * scale
  const trunkPosition = [position[0], position[1] + trunkHeight / 2, position[2]]

  const [trunkRef] = useCylinder(() => ({
    type: 'Static',
    position: trunkPosition,
    args: [0.2 * scale, 0.28 * scale, trunkHeight, 8],
  }))

  return (
    <>
      <mesh ref={trunkRef} castShadow>
        <cylinderGeometry args={[0.2 * scale, 0.28 * scale, trunkHeight, 8]} />
        <meshStandardMaterial color="#6b4a2f" />
      </mesh>
      <mesh castShadow position={[position[0], position[1] + trunkHeight + 0.9 * scale, position[2]]}>
        <coneGeometry args={[1.1 * scale, 1.8 * scale, 8]} />
        <meshStandardMaterial color="#2f6b3a" />
      </mesh>
      <mesh castShadow position={[position[0], position[1] + trunkHeight + 1.8 * scale, position[2]]}>
        <coneGeometry args={[0.8 * scale, 1.3 * scale, 8]} />
        <meshStandardMaterial color="#357a41" />
      </mesh>
    </>
  )
}

function Rock({ position, scale, rotationY }) {
  const rockPosition = [position[0], position[1] + 0.45 * scale, position[2]]
  const rockRotation = [0.3, rotationY, 0.15]

  const [ref] = useSphere(() => ({
    type: 'Static',
    position: rockPosition,
    rotation: rockRotation,
    args: [0.55 * scale],
  }))

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <icosahedronGeometry args={[0.55 * scale, 0]} />
      <meshStandardMaterial color="#8a8a86" flatShading roughness={1} />
    </mesh>
  )
}

export default function Scenery() {
  return (
    <>
      {SCENERY.trees.map((tree, i) => (
        <Tree key={`tree-${i}`} {...tree} />
      ))}
      {SCENERY.rocks.map((rock, i) => (
        <Rock key={`rock-${i}`} {...rock} />
      ))}
    </>
  )
}
