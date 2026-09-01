export const QUESTS = [
  {
    id: 'awaken_spires',
    title: '균열의 근원',
    description: '들판 곳곳에 잠든 고대 결정탑을 찾아 깨우세요.',
    type: 'discover',
    targetCount: 4,
    reward: { exp: 120, gold: 80 },
  },
  {
    id: 'gather_herbs',
    title: '약초 채집',
    description: '들판에 흩어진 약초 5개를 모아오세요.',
    type: 'collect',
    itemId: 'herb',
    targetCount: 5,
    reward: { exp: 40, gold: 20 },
  },
  {
    id: 'slime_hunt',
    title: '슬라임 사냥',
    description: '슬라임 3마리를 처치하세요.',
    type: 'defeat',
    monsterType: 'slime',
    targetCount: 3,
    reward: { exp: 80, gold: 50, itemId: 'sword' },
  },
]
