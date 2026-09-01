import { create } from 'zustand'

const DAY_LENGTH_SECONDS = 120

export const useWorldStore = create((set, get) => ({
  timeOfDay: 0.28, // 0 = midnight, 0.5 = noon; start mid-morning
  dayLengthSeconds: DAY_LENGTH_SECONDS,
  advanceTime: (delta) => {
    const next = (get().timeOfDay + delta / get().dayLengthSeconds) % 1
    set({ timeOfDay: next })
  },
}))
