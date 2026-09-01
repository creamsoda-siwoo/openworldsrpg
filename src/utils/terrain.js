import { fbm2D } from './noise'

export const TERRAIN_SIZE = 240
export const TERRAIN_SEGMENTS = 120
export const MAX_HEIGHT = 16
export const SPAWN_FLAT_RADIUS = 20

const TERRAIN_SEED = 1337

function clamp01(t) {
  return Math.max(0, Math.min(1, t))
}

function smoothstep(t) {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

export function terrainHeightAt(x, z) {
  const n = fbm2D(x, z, { octaves: 5, frequency: 0.015, persistence: 0.5, seed: TERRAIN_SEED })
  const base = (n - 0.5) * 2 * MAX_HEIGHT
  const falloff = smoothstep(Math.hypot(x, z) / SPAWN_FLAT_RADIUS)
  return Math.max(base * falloff, -4)
}
