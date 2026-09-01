import { useEffect } from 'react'
import { useAudioStore } from '../store/useAudioStore'

// Browsers block audio autoplay until the user interacts with the page, so
// background music starts on the first click/keypress rather than on mount.
export default function useBackgroundMusic() {
  useEffect(() => {
    const startMusic = () => {
      useAudioStore.getState().playMusic('bgm')
      window.removeEventListener('pointerdown', startMusic)
      window.removeEventListener('keydown', startMusic)
    }
    window.addEventListener('pointerdown', startMusic)
    window.addEventListener('keydown', startMusic)
    return () => {
      window.removeEventListener('pointerdown', startMusic)
      window.removeEventListener('keydown', startMusic)
    }
  }, [])
}
