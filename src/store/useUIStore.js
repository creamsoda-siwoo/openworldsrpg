import { create } from 'zustand'
import { useAudioStore } from './useAudioStore'

export const useUIStore = create((set, get) => ({
  inventoryOpen: false,
  dialogueOpen: false,
  menuOpen: false,
  nearNPC: false,

  toggleInventory: () => {
    const opening = !get().inventoryOpen
    useAudioStore.getState().playSound(opening ? 'uiOpen' : 'uiClose')
    set({ inventoryOpen: opening, dialogueOpen: false, menuOpen: false })
  },
  openDialogue: () => {
    useAudioStore.getState().playSound('uiOpen')
    set({ dialogueOpen: true, inventoryOpen: false, menuOpen: false })
  },
  closeDialogue: () => {
    if (get().dialogueOpen) useAudioStore.getState().playSound('uiClose')
    set({ dialogueOpen: false })
  },
  toggleMenu: () => {
    const opening = !get().menuOpen
    useAudioStore.getState().playSound(opening ? 'uiOpen' : 'uiClose')
    set({ menuOpen: opening, inventoryOpen: false, dialogueOpen: false })
  },
  closeAll: () => set({ inventoryOpen: false, dialogueOpen: false, menuOpen: false }),
  setNearNPC: (value) => set({ nearNPC: value }),

  isBlockingInput: () => get().inventoryOpen || get().dialogueOpen || get().menuOpen,
}))
