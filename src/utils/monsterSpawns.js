import { mulberry32 } from './noise'
import { terrainHeightAt, SPAWN_FLAT_RADIUS } from './terrain'

const SEED = 4242
const COUNT = 6
const MIN_RADIUS = SPAWN_FLAT_RADIUS - 6
const MAX_RADIUS = 45

function build() {
  const rng = mulberry32(SEED)
  const spawns = []
  for (let i = 0; i < COUNT; i++) {
    const angle = rng() * Math.PI * 2
    const radius = MIN_RADIUS + rng() * (MAX_RADIUS - MIN_RADIUS)
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    spawns.push({ id: `slime-${i}`, position: [x, terrainHeightAt(x, z), z] })
  }
  return spawns
}

export const MONSTER_SPAWNS = build()
