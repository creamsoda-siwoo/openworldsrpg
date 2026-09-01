import { useEffect } from 'react'
import { saveGame } from '../utils/saveGame'

const AUTO_SAVE_INTERVAL_MS = 30_000

export default function useAutoSave() {
  useEffect(() => {
    const id = setInterval(saveGame, AUTO_SAVE_INTERVAL_MS)
    window.addEventListener('beforeunload', saveGame)
    return () => {
      clearInterval(id)
      window.removeEventListener('beforeunload', saveGame)
    }
  }, [])
}
