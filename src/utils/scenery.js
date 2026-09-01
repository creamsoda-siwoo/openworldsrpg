import { mulberry32 } from './noise'
import { terrainHeightAt, TERRAIN_SIZE, SPAWN_FLAT_RADIUS } from './terrain'

const SCENERY_SEED = 2024
const PLACEMENT_HALF_EXTENT = TERRAIN_SIZE / 2 - 6

function generatePoints(count, rng, minRadius) {
  const points = []
  let guard = 0
  while (points.length < count && guard < count * 30) {
    guard++
    const x = (rng() * 2 - 1) * PLACEMENT_HALF_EXTENT
    const z = (rng() * 2 - 1) * PLACEMENT_HALF_EXTENT
    if (Math.hypot(x, z) < minRadius) continue
    points.push({ x, z })
  }
  return points
}

function buildScenery() {
  const rng = mulberry32(SCENERY_SEED)
  const treePoints = generatePoints(70, rng, SPAWN_FLAT_RADIUS)
  const rockPoints = generatePoints(30, rng, SPAWN_FLAT_RADIUS)

  const trees = treePoints.map((p) => ({
    position: [p.x, terrainHeightAt(p.x, p.z), p.z],
    scale: 0.8 + rng() * 0.6,
  }))

  const rocks = rockPoints.map((p) => ({
    position: [p.x, terrainHeightAt(p.x, p.z), p.z],
    scale: 0.5 + rng() * 1.1,
    rotationY: rng() * Math.PI * 2,
  }))

  return { trees, rocks }
}

export const SCENERY = buildScenery()
