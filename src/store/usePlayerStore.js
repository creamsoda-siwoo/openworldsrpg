import { create } from 'zustand'

export const usePlayerStore = create((set) => ({
  position: [0, 0, 0],
  heading: 0,
  setTransform: (position, heading) => set({ position, heading }),
}))
