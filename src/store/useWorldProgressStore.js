import { create } from 'zustand'

// Tracks which world entities (identified by their deterministic spawn id)
// are already gone, so a reload/save-load doesn't respawn defeated monsters
// or already-collected pickups.
export const useWorldProgressStore = create((set, get) => ({
  defeatedMonsterIds: [],
  collectedItemIds: [],

  isMonsterDefeated: (id) => get().defeatedMonsterIds.includes(id),
  markMonsterDefeated: (id) => {
    if (get().defeatedMonsterIds.includes(id)) return
    set((s) => ({ defeatedMonsterIds: [...s.defeatedMonsterIds, id] }))
  },

  isItemCollected: (id) => get().collectedItemIds.includes(id),
  markItemCollected: (id) => {
    if (get().collectedItemIds.includes(id)) return
    set((s) => ({ collectedItemIds: [...s.collectedItemIds, id] }))
  },
}))
