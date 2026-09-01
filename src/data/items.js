export const ITEMS = {
  herb: {
    id: 'herb',
    name: '약초',
    type: 'material',
    description: '들판에서 채집한 약초. 퀘스트 재료로 쓰인다.',
  },
  potion: {
    id: 'potion',
    name: '체력 물약',
    type: 'consumable',
    heal: 30,
    description: '체력을 30 회복한다.',
  },
  slimeGel: {
    id: 'slimeGel',
    name: '슬라임 젤리',
    type: 'material',
    description: '슬라임을 처치하면 얻는다.',
  },
  sword: {
    id: 'sword',
    name: '낡은 검',
    type: 'weapon',
    damage: 15,
    description: '맨손보다 강한 근접 무기. 장착 시 공격력 증가.',
  },
}

export const UNARMED_DAMAGE = 8
