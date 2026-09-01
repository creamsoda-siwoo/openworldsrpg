import { create } from 'zustand'

// Positions are mutated in place on the stored entry objects rather than via
// `set`, matching the imperative pattern used for the player transform: combat
// and AI code reads the latest position every frame via getState() without
// subscribing, so this never triggers a React re-render.
export const useMonsterRegistry = create(() => ({
  monsters: {}, // id -> { position: [x,y,z], hit: (damage) => void }
}))

export function registerMonster(id, entry) {
  useMonsterRegistry.setState((s) => ({ monsters: { ...s.monsters, [id]: entry } }))
}

export function unregisterMonster(id) {
  useMonsterRegistry.setState((s) => {
    const monsters = { ...s.monsters }
    delete monsters[id]
    return { monsters }
  })
}
