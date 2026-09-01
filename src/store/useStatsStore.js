import { create } from 'zustand'
import { useAudioStore } from './useAudioStore'
import { useToastStore } from './useToastStore'

function expToNextLevel(level) {
  return 50 + level * 25
}

function maxHealthForLevel(level) {
  return 100 + (level - 1) * 15
}

export const useStatsStore = create((set, get) => ({
  level: 1,
  exp: 0,
  expToNext: expToNextLevel(1),
  maxHealth: maxHealthForLevel(1),
  health: maxHealthForLevel(1),
  maxStamina: 100,
  stamina: 100,

  takeDamage: (amount) => {
    if (amount <= 0) return
    useAudioStore.getState().playSound('damage')
    set((s) => ({ health: Math.max(0, s.health - amount) }))
  },

  heal: (amount) => {
    if (amount <= 0) return
    set((s) => ({ health: Math.min(s.maxHealth, s.health + amount) }))
  },

  consumeStamina: (amount) => {
    const { stamina } = get()
    if (stamina < amount) return false
    set({ stamina: stamina - amount })
    return true
  },

  regenStamina: (amount) => {
    set((s) => ({ stamina: Math.min(s.maxStamina, s.stamina + amount) }))
  },

  gainExp: (amount) => {
    const start = get()
    let { level, exp, expToNext, maxHealth } = start
    exp += amount
    let leveledUp = false
    while (exp >= expToNext) {
      exp -= expToNext
      level += 1
      expToNext = expToNextLevel(level)
      maxHealth = maxHealthForLevel(level)
      leveledUp = true
    }
    set({
      level,
      exp,
      expToNext,
      maxHealth,
      health: leveledUp ? maxHealth : start.health,
      stamina: leveledUp ? get().maxStamina : start.stamina,
    })

    if (leveledUp) {
      useAudioStore.getState().playSound('levelup')
      useToastStore.getState().push(`레벨 업! Lv.${level}`)
    }
  },

  respawn: () => {
    const { maxHealth, maxStamina } = get()
    set({ health: maxHealth, stamina: maxStamina })
  },
}))
