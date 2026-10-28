import { useMemo } from 'react'
import * as THREE from 'three'
import { useHeightfield } from '@react-three/cannon'
import { terrainHeightAt, TERRAIN_SIZE, TERRAIN_SEGMENTS } from '../../utils/terrain'
import {
  HEIGHTFIELD_DATA,
  HEIGHTFIELD_ELEMENT_SIZE,
  HEIGHTFIELD_POSITION,
  HEIGHTFIELD_ROTATION,
} from '../../utils/terrainHeightfield'

const GRASS = new THREE.Color('#4a8f4f')
const DIRT = new THREE.Color('#8a6d4b')
const ROCK = new THREE.Color('#8a8a86')
const SNOW = new THREE.Color('#e8ecef')

function colorForHeight(h) {
  if (h < 1) return GRASS
  if (h < 5) return GRASS.clone().lerp(DIRT, (h - 1) / 4)
  if (h < 10) return DIRT.clone().lerp(ROCK, (h - 5) / 5)
  return ROCK.clone().lerp(SNOW, Math.min(1, (h - 10) / 4))
}

function buildTerrainGeometry() {
  const geometry = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS)
  geometry.rotateX(-Math.PI / 2)

  const position = geometry.attributes.position
  const colors = new Float32Array(position.count * 3)
  const color = new THREE.Color()

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const z = position.getZ(i)
    const h = terrainHeightAt(x, z)
    position.setY(i, h)
    color.copy(colorForHeight(h))
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  return geometry
}

// Invisible physics-only collider - kept separate from the visual mesh above
// because the mesh's own transform is identity (its slope is baked into
// vertex positions), while the heightfield body needs its own position and
// rotation to line up with the world.
function TerrainCollider() {
  const [ref] = useHeightfield(() => ({
    type: 'Static',
    args: [HEIGHTFIELD_DATA, { elementSize: HEIGHTFIELD_ELEMENT_SIZE }],
    position: HEIGHTFIELD_POSITION,
    rotation: HEIGHTFIELD_ROTATION,
    material: 'ground',
  }))
  return <group ref={ref} />
}

export default function Terrain() {
  const geometry = useMemo(() => buildTerrainGeometry(), [])

  return (
    <>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={1} />
      </mesh>
      <TerrainCollider />
    </>
  )
}
