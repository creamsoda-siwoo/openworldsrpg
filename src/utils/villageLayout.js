import { terrainHeightAt } from './terrain'

export const VILLAGE_CENTER = [0, 0]
// Matches SPAWN_FLAT_RADIUS, the same boundary scenery already keeps clear of -
// monsters are kept out to here so the village reads as a safe zone.
export const VILLAGE_SAFE_RADIUS = 20
export const VILLAGE_FENCE_RADIUS = 15

const RAW_HOUSES = [
  { x: 11, z: 0, width: 4.4, depth: 4, height: 2.6, color: '#c9a876', roofColor: '#7a3b2e' },
  { x: 3.4, z: 10.5, width: 4, depth: 4.4, height: 2.7, color: '#b98f66', roofColor: '#6f3527' },
  { x: -8.9, z: 6.5, width: 4.6, depth: 4, height: 2.6, color: '#c2a479', roofColor: '#7a3b2e' },
  { x: -8.9, z: -6.5, width: 4, depth: 4.4, height: 2.8, color: '#bd9a6e', roofColor: '#6f3527' },
  { x: 3.4, z: -10.5, width: 4.4, depth: 4, height: 2.6, color: '#c9a876', roofColor: '#7a3b2e' },
]

export const VILLAGE_HOUSES = RAW_HOUSES.map((h) => ({
  ...h,
  // Face the plaza center, using the same atan2(dx, dz) heading convention
  // used everywhere else in the game (heading 0 = facing +Z).
  rotationY: Math.atan2(-h.x, -h.z),
  position: [h.x, terrainHeightAt(h.x, h.z), h.z],
}))

const WELL_X = 3
const WELL_Z = 3.5
export const VILLAGE_WELL_POSITION = [WELL_X, terrainHeightAt(WELL_X, WELL_Z), WELL_Z]

const LAMP_OFFSETS = [
  [6.5, 3],
  [-6.5, 3.5],
  [0, -7.5],
  [0, 7.5],
]
export const VILLAGE_LAMPS = LAMP_OFFSETS.map(([x, z]) => [x, terrainHeightAt(x, z), z])

const FENCE_SEGMENTS = 28
const GATE_HALF_WIDTH = 0.28 // radians
// Houses sit exactly on the 0/72/144/216/288 degree marks (5-fold ring), so
// gates are placed in the gaps between them rather than lining up with a house.
const GATE_ANGLES = [Math.PI / 5, Math.PI]

function nearAnyGate(angle) {
  return GATE_ANGLES.some((gate) => {
    const diff = Math.atan2(Math.sin(angle - gate), Math.cos(angle - gate))
    return Math.abs(diff) < GATE_HALF_WIDTH
  })
}

export const VILLAGE_FENCE_POSTS = (() => {
  const posts = []
  for (let i = 0; i < FENCE_SEGMENTS; i++) {
    const angle = (i / FENCE_SEGMENTS) * Math.PI * 2
    if (nearAnyGate(angle)) continue
    const x = Math.cos(angle) * VILLAGE_FENCE_RADIUS
    const z = Math.sin(angle) * VILLAGE_FENCE_RADIUS
    posts.push([x, terrainHeightAt(x, z), z])
  }
  return posts
})()

export const VILLAGER_ANCHORS = VILLAGE_HOUSES.slice(0, 3).map((h) => {
  const angle = h.rotationY
  // Stand well clear of the door so the wander loop below never puts the
  // villager back inside the wall (villagers have no physics collider).
  const distance = h.depth / 2 + 2.2
  const ax = h.x + Math.sin(angle) * distance
  const az = h.z + Math.cos(angle) * distance
  return [ax, terrainHeightAt(ax, az), az]
})
