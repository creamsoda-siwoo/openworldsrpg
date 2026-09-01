import { create } from 'zustand'
import { ITEMS } from '../data/items'
import { useStatsStore } from './useStatsStore'
import { useQuestStore } from './useQuestStore'
import { useAudioStore } from './useAudioStore'

export const useInventoryStore = create((set, get) => ({
  items: {}, // itemId -> quantity
  gold: 0,
  equippedWeaponId: null,

  addItem: (itemId, quantity = 1) => {
    set((s) => ({
      items: { ...s.items, [itemId]: (s.items[itemId] || 0) + quantity },
    }))
    useAudioStore.getState().playSound('pickup')
    useQuestStore.getState().reportCollect(itemId, get().items[itemId])
  },

  removeItem: (itemId, quantity = 1) => {
    set((s) => {
      const current = s.items[itemId] || 0
      const next = Math.max(0, current - quantity)
      const items = { ...s.items }
      if (next === 0) delete items[itemId]
      else items[itemId] = next
      return { items }
    })
  },

  addGold: (amount) => set((s) => ({ gold: s.gold + amount })),

  useItem: (itemId) => {
    const item = ITEMS[itemId]
    const qty = get().items[itemId] || 0
    if (!item || qty <= 0) return

    if (item.type === 'consumable') {
      useStatsStore.getState().heal(item.heal ?? 0)
      get().removeItem(itemId, 1)
    } else if (item.type === 'weapon') {
      get().equipWeapon(itemId)
    }
  },

  equipWeapon: (itemId) => {
    const item = ITEMS[itemId]
    if (!item || item.type !== 'weapon') return
    if (!(get().items[itemId] > 0)) return
    set({ equippedWeaponId: itemId })
  },
}))
