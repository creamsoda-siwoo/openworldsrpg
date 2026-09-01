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
    attackType: 'melee',
    damage: 15,
    range: 2.2,
    price: 40,
    description: '맨손보다 강한 근접 무기. 장착 시 공격력 증가.',
  },
  bow: {
    id: 'bow',
    name: '사냥꾼의 활',
    type: 'weapon',
    attackType: 'ranged',
    damage: 12,
    price: 60,
    description: '화살을 쏘는 원거리 무기. 안전한 거리에서 싸울 수 있다.',
  },
}

export const UNARMED_DAMAGE = 8
export const UNARMED_RANGE = 2.2

export const SHOP_ITEM_IDS = ['sword', 'bow']
