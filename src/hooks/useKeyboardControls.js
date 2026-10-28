import { useEffect, useRef } from 'react'

const KEY_MAP = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  Space: 'jump',
  ShiftLeft: 'dodge',
  ShiftRight: 'dodge',
}

export default function useKeyboardControls() {
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    dodge: false,
  })

  useEffect(() => {
    const handleKey = (down) => (event) => {
      const action = KEY_MAP[event.code]
      if (!action) return
      keys.current[action] = down
    }

    const onKeyDown = handleKey(true)
    const onKeyUp = handleKey(false)
    // Alt-tabbing away swallows the keyup, which would leave the character
    // running on its own when focus comes back.
    const onBlur = () => {
      Object.keys(keys.current).forEach((action) => (keys.current[action] = false))
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  return keys
}
