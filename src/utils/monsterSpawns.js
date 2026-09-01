import { mulberry32 } from './noise'
import { terrainHeightAt, SPAWN_FLAT_RADIUS } from './terrain'

const SEED = 4242
const COUNT = 14
const MIN_RADIUS = SPAWN_FLAT_RADIUS - 6
const MAX_RADIUS = 95
const MIN_SEPARATION = 7

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

    spawns.push({ id: `slime-${spawns.length}`, position: [x, terrainHeightAt(x, z), z] })
  }

  return spawns
}

export const MONSTER_SPAWNS = build()
