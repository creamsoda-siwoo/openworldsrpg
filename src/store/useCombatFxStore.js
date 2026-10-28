import { create } from 'zustand'
import { useAudioStore } from './useAudioStore'
import { usePlayerStore } from './usePlayerStore'

const POPUP_LIFETIME_MS = 900
const COMBO_WINDOW_MS = 2000
const CRIT_CHANCE = 0.15
const CRIT_MULTIPLIER = 2
const COMBO_BONUS_PER_HIT = 0.05
const MAX_COMBO_BONUS_HITS = 10

let nextId = 1
let comboTimer = null

// Camera shake is read every frame by CameraShake, so it lives outside the
// store as a plain mutable object - updating it never re-renders anything.
export const cameraShake = { trauma: 0 }

export function addShake(amount) {
  cameraShake.trauma = Math.min(1, cameraShake.trauma + amount)
}

// Extra degrees of field of view the camera eases toward (sprint/dodge kick).
export const cameraFov = { boost: 0 }

// Heavy-attack charge in [0, 1], written by PlayerController every frame and
// read by the HUD's charge ring without going through React state.
export const playerCharge = { value: 0 }

// Share of dropped orbs that heal; the rest restore stamina.
const HEAL_ORB_CHANCE = 0.4

export const useCombatFxStore = create((set, get) => ({
  popups: [], // { id, position:[x,y,z], text, kind: 'normal'|'crit'|'hurt'|'dodge' }
  bursts: [], // { id, position:[x,y,z], color, particles:[{ vx, vy, vz, size }] }
  orbs: [], // { id, position:[x,y,z], kind: 'heal'|'stamina', velocity:[x,y,z] }
  shockwaves: [], // { id, position:[x,y,z], radius, color }
  sprinting: false,
  combo: 0,
  hurtSignal: 0,
  invulnerableUntil: 0,

  spawnPopup: (position, text, kind = 'normal') => {
    const id = nextId++
    set((s) => ({ popups: [...s.popups, { id, position, text, kind }] }))
    setTimeout(() => set((s) => ({ popups: s.popups.filter((p) => p.id !== id) })), POPUP_LIFETIME_MS)
  },

  spawnBurst: (position, color, count = 14) => {
    const id = nextId++
    const particles = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 3.5
      return {
        vx: Math.cos(angle) * speed,
        vy: 3 + Math.random() * 4,
        vz: Math.sin(angle) * speed,
        size: 0.08 + Math.random() * 0.1,
      }
    })
    set((s) => ({ bursts: [...s.bursts, { id, position, color, particles }] }))
  },

  removeBurst: (id) => set((s) => ({ bursts: s.bursts.filter((b) => b.id !== id) })),

  spawnOrbs: (position, count) => {
    const orbs = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 1.5 + Math.random() * 2.5
      return {
        id: nextId++,
        position: [position[0], position[1] + 0.3, position[2]],
        kind: Math.random() < HEAL_ORB_CHANCE ? 'heal' : 'stamina',
        velocity: [Math.cos(angle) * speed, 4 + Math.random() * 3, Math.sin(angle) * speed],
      }
    })
    set((s) => ({ orbs: [...s.orbs, ...orbs] }))
  },

  removeOrb: (id) => set((s) => ({ orbs: s.orbs.filter((o) => o.id !== id) })),

  spawnShockwave: (position, radius, color = '#ffffff') => {
    const id = nextId++
    set((s) => ({ shockwaves: [...s.shockwaves, { id, position, radius, color }] }))
  },

  removeShockwave: (id) => set((s) => ({ shockwaves: s.shockwaves.filter((w) => w.id !== id) })),

  setSprinting: (sprinting) => {
    if (get().sprinting !== sprinting) set({ sprinting })
  },

  // Called once per attack that connects with at least one enemy, so a
  // sweeping swing that clips three slimes still counts as a single combo step.
  registerComboHit: () => {
    set((s) => ({ combo: s.combo + 1 }))
    clearTimeout(comboTimer)
    comboTimer = setTimeout(() => set({ combo: 0 }), COMBO_WINDOW_MS)
  },

  resetCombo: () => {
    clearTimeout(comboTimer)
    set({ combo: 0 })
  },

  // Rolls crit and applies the current combo bonus to a base weapon damage.
  rollDamage: (base) => {
    const comboBonus = 1 + Math.min(get().combo, MAX_COMBO_BONUS_HITS) * COMBO_BONUS_PER_HIT
    const crit = Math.random() < CRIT_CHANCE
    const damage = Math.round(base * comboBonus * (crit ? CRIT_MULTIPLIER : 1))
    return { damage, crit }
  },

  setInvulnerable: (seconds) => set({ invulnerableUntil: performance.now() + seconds * 1000 }),
  isInvulnerable: () => performance.now() < get().invulnerableUntil,

  notifyPlayerHurt: (amount) => {
    const [x, y, z] = usePlayerStore.getState().position
    get().spawnPopup([x, y + 1.6, z], `-${amount}`, 'hurt')
    get().resetCombo()
    addShake(0.45)
    set((s) => ({ hurtSignal: s.hurtSignal + 1 }))
  },

  notifyPerfectDodge: () => {
    const [x, y, z] = usePlayerStore.getState().position
    get().spawnPopup([x, y + 1.6, z], '회피!', 'dodge')
    useAudioStore.getState().playSound('perfectDodge')
  },
}))

// Shared feedback for any enemy taking a hit: floating number, sound, shake.
export function reportEnemyHit(position, damage, crit) {
  const [x, y, z] = position
  const jitter = () => (Math.random() - 0.5) * 0.5
  useCombatFxStore.getState().spawnPopup([x + jitter(), y + 1.1, z + jitter()], crit ? `${damage}!` : `${damage}`, crit ? 'crit' : 'normal')
  useAudioStore.getState().playSound(crit ? 'crit' : 'hit')
  addShake(crit ? 0.35 : 0.15)
}

export function reportEnemyDeath(position, color) {
  useCombatFxStore.getState().spawnBurst(position, color, 18)
  addShake(0.3)
}
