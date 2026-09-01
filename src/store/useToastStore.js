import { create } from 'zustand'

let nextId = 1
const TOAST_DURATION_MS = 3000

export const useToastStore = create((set) => ({
  toasts: [],

  push: (message) => {
    const id = nextId++
    set((s) => ({ toasts: [...s.toasts, { id, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, TOAST_DURATION_MS)
  },
}))
