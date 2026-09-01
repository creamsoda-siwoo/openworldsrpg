import { create } from 'zustand'

let nextId = 1

export const useProjectileStore = create((set) => ({
  arrows: [], // { id, position:[x,y,z], direction:[x,z], damage }

  spawnArrow: (position, direction, damage) => {
    const id = nextId++
    set((s) => ({ arrows: [...s.arrows, { id, position, direction, damage }] }))
  },

  removeArrow: (id) => {
    set((s) => ({ arrows: s.arrows.filter((a) => a.id !== id) }))
  },
}))
