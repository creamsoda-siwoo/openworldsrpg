import { useEffect } from 'react'
import { useUIStore } from '../store/useUIStore'

export default function useUIKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (event) => {
      const { nearNPC, dialogueOpen, inventoryOpen, openDialogue, closeDialogue, toggleInventory, toggleMenu, closeAll } =
        useUIStore.getState()

      if (event.code === 'KeyE') {
        if (dialogueOpen) closeDialogue()
        else if (nearNPC && !inventoryOpen) openDialogue()
      } else if (event.code === 'KeyI') {
        toggleInventory()
      } else if (event.code === 'KeyP') {
        toggleMenu()
      } else if (event.code === 'Escape') {
        closeAll()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
