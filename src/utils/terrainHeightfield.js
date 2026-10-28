import { terrainHeightAt, TERRAIN_SIZE, TERRAIN_SEGMENTS } from './terrain'

export const HEIGHTFIELD_ELEMENT_SIZE = TERRAIN_SIZE / TERRAIN_SEGMENTS

// cannon's Heightfield shape spreads its data along its own local X/Y axes
// and stores height along local Z. Rotating the body -90deg about X (the
// same convention three.js's PlaneGeometry.rotateX(-Math.PI / 2) uses for the
// visual terrain) sends local X -> world X, local Z (height) -> world Y, and
// local Y -> world -Z. The position offsets below counter that mapping so
// grid index [i][j] lands exactly on the world (x, z) that terrainHeightAt()
// and the visual mesh already use for that same index.
export const HEIGHTFIELD_POSITION = [-TERRAIN_SIZE / 2, 0, TERRAIN_SIZE / 2]
export const HEIGHTFIELD_ROTATION = [-Math.PI / 2, 0, 0]

function build() {
  const points = TERRAIN_SEGMENTS + 1
  const data = []
  for (let i = 0; i < points; i++) {
    const worldX = -TERRAIN_SIZE / 2 + i * HEIGHTFIELD_ELEMENT_SIZE
    const row = []
    for (let j = 0; j < points; j++) {
      const worldZ = TERRAIN_SIZE / 2 - j * HEIGHTFIELD_ELEMENT_SIZE
      row.push(terrainHeightAt(worldX, worldZ))
    }
    data.push(row)
  }
  return data
}

export const HEIGHTFIELD_DATA = build()
