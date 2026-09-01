import { terrainHeightAt } from './terrain'

export const VILLAGE_WARP_ID = 'village'

const RAW_POINTS = [
  { id: 'village', name: '시작 마을', x: 0, z: 0 },
  { id: 'grove', name: '슬라임 평원 결정탑', x: -45, z: 42 },
  { id: 'ridge', name: '바람의 능선 결정탑', x: 52, z: -35 },
  { id: 'hollow', name: '그림자 골짜기 결정탑', x: -60, z: -48 },
  { id: 'summit', name: '균열의 첨탑', x: 68, z: 58 },
]

export const WARP_POINTS = RAW_POINTS.map((p) => ({
  ...p,
  position: [p.x, terrainHeightAt(p.x, p.z), p.z],
}))

export const DISCOVERABLE_WARP_COUNT = WARP_POINTS.filter((p) => p.id !== VILLAGE_WARP_ID).length
