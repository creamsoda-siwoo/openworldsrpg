import { create } from 'zustand'
import { SOUNDS, MUSIC } from '../audio/sounds'
import { playSynth } from '../audio/synth'

const STORAGE_KEY = 'openworldrpg-audio-settings'
const DEFAULT_SETTINGS = { volume: 0.6, muted: false }

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    // ignore malformed/inaccessible storage
  }
  return DEFAULT_SETTINGS
}

function persistSettings(volume, muted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume, muted }))
  } catch {
    // storage unavailable (private mode, quota) - settings just won't persist
  }
}

let bgmAudio = null
// Keys whose file failed to load once - skip straight to the synth after that
// instead of re-requesting a file we know isn't there.
const missingSounds = new Set()

function applyBgmVolume(volume, muted) {
  if (bgmAudio) bgmAudio.volume = muted ? 0 : volume * 0.5
}

export const useAudioStore = create((set, get) => ({
  ...loadSettings(),

  playSound: (key) => {
    const { muted, volume } = get()
    if (muted) return
    const src = SOUNDS[key]
    if (!src || missingSounds.has(key)) {
      playSynth(key, volume)
      return
    }
    try {
      const audio = new Audio(src)
      audio.volume = volume
      audio.addEventListener(
        'error',
        () => {
          missingSounds.add(key)
          playSynth(key, volume)
        },
        { once: true },
      )
      audio.play().catch(() => {})
    } catch {
      missingSounds.add(key)
      playSynth(key, volume)
    }
  },

  playMusic: (key = 'bgm') => {
    const { muted, volume } = get()
    const src = MUSIC[key]
    if (!src) return
    if (!bgmAudio) {
      bgmAudio = new Audio(src)
      bgmAudio.loop = true
      bgmAudio.addEventListener('error', () => {}, { once: true })
    }
    applyBgmVolume(volume, muted)
    bgmAudio.play().catch(() => {})
  },

  setVolume: (volume) => {
    set({ volume })
    applyBgmVolume(volume, get().muted)
    persistSettings(volume, get().muted)
  },

  toggleMuted: () => {
    const muted = !get().muted
    set({ muted })
    applyBgmVolume(get().volume, muted)
    persistSettings(get().volume, muted)
  },
}))
