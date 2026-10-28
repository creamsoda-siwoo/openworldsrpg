import { mulberry32 } from './noise'
import { terrainHeightAt } from './terrain'
import { VILLAGE_SAFE_RADIUS } from './villageLayout'

const SEED = 9911
const COUNT = 8
// Goblins are the tougher threat, so they roam farther out than slimes.
const MIN_RADIUS = VILLAGE_SAFE_RADIUS + 15
const MAX_RADIUS = 95
const MIN_SEPARATION = 9

function build() {
  const rng = mulberry32(SEED)
  const spawns = []
  let guard = 0

  while (spawns.length < COUNT && guard < COUNT * 40) {
    guard++
    const angle = rng() * Math.PI * 2
    const radius = MIN_RADIUS + rng() * (MAX_RADIUS - MIN_RADIUS)
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    const tooClose = spawns.some((s) => Math.hypot(s.position[0] - x, s.position[2] - z) < MIN_SEPARATION)
    if (tooClose) continue

    spawns.push({ id: `goblin-${spawns.length}`, position: [x, terrainHeightAt(x, z), z] })
  }

  return spawns
}

export const GOBLIN_SPAWNS = build()
