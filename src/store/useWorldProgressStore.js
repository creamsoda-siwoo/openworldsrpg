import { create } from 'zustand'

// Monsters respawn after a delay instead of staying gone forever, so the
// world doesn't run dry after the initial spawns are cleared. Pickups still
// stay collected permanently once taken.
export const useWorldProgressStore = create((set, get) => ({
  monsterRespawnAt: {}, // id -> ms timestamp when it becomes alive again
  collectedItemIds: [],
  hasSeenIntro: false,

  isMonsterAlive: (id) => {
    const respawnAt = get().monsterRespawnAt[id]
    return !respawnAt || Date.now() >= respawnAt
  },
  markMonsterDefeated: (id, respawnDelayMs) => {
    set((s) => ({ monsterRespawnAt: { ...s.monsterRespawnAt, [id]: Date.now() + respawnDelayMs } }))
  },

  isItemCollected: (id) => get().collectedItemIds.includes(id),
  markItemCollected: (id) => {
    if (get().collectedItemIds.includes(id)) return
    set((s) => ({ collectedItemIds: [...s.collectedItemIds, id] }))
  },

  markIntroSeen: () => set({ hasSeenIntro: true }),
}))
