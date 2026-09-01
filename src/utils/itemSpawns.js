import { mulberry32 } from './noise'
import { terrainHeightAt, SPAWN_FLAT_RADIUS } from './terrain'

const SEED = 7331
const COUNT = 8
const MIN_RADIUS = SPAWN_FLAT_RADIUS - 12
const MAX_RADIUS = 40

function build() {
  const rng = mulberry32(SEED)
  const spawns = []
  for (let i = 0; i < COUNT; i++) {
    const angle = rng() * Math.PI * 2
    const radius = MIN_RADIUS + rng() * (MAX_RADIUS - MIN_RADIUS)
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    spawns.push({ id: `herb-${i}`, itemId: 'herb', position: [x, terrainHeightAt(x, z), z] })
  }
  return spawns
}

export const ITEM_SPAWNS = build()
