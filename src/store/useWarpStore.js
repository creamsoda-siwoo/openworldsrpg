import { create } from 'zustand'
import { VILLAGE_WARP_ID } from '../utils/warpPoints'

export const useWarpStore = create((set, get) => ({
  discoveredIds: [VILLAGE_WARP_ID],
  pendingWarpTarget: null, // [x, z] or null

  isDiscovered: (id) => get().discoveredIds.includes(id),
  discover: (id) => {
    if (get().discoveredIds.includes(id)) return
    set((s) => ({ discoveredIds: [...s.discoveredIds, id] }))
  },

  requestWarp: (position) => set({ pendingWarpTarget: position }),
  clearWarpRequest: () => set({ pendingWarpTarget: null }),
}))
