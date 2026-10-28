// Procedural fallback sound effects built from Web Audio oscillators and
// noise. Used whenever a key has no audio file under public/audio/ (or the
// file failed to load), so the game has punchy feedback out of the box.
// Dropping a real file in still takes priority - see useAudioStore.

let ctx = null
let noiseBuffer = null

function getContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function getNoiseBuffer(ac) {
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

function tone(ac, out, { type = 'sine', from, to = from, start = 0, duration, gain = 0.3 }) {
  const t = ac.currentTime + start
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t)
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + duration)
  amp.gain.setValueAtTime(gain, t)
  amp.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.connect(amp).connect(out)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

function noise(ac, out, { from, to = from, q = 1, start = 0, duration, gain = 0.3 }) {
  const t = ac.currentTime + start
  const src = ac.createBufferSource()
  src.buffer = getNoiseBuffer(ac)
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = q
  filter.frequency.setValueAtTime(from, t)
  filter.frequency.exponentialRampToValueAtTime(Math.max(1, to), t + duration)
  const amp = ac.createGain()
  amp.gain.setValueAtTime(gain, t)
  amp.gain.exponentialRampToValueAtTime(0.001, t + duration)
  src.connect(filter).connect(amp).connect(out)
  src.start(t)
  src.stop(t + duration + 0.02)
}

function arpeggio(ac, out, notes, step, type = 'triangle', gain = 0.22) {
  notes.forEach((freq, i) => tone(ac, out, { type, from: freq, start: i * step, duration: step * 2.2, gain }))
}

const RECIPES = {
  attack: (ac, out) => noise(ac, out, { from: 600, to: 3000, q: 1.5, duration: 0.12, gain: 0.35 }),
  hit: (ac, out) => {
    tone(ac, out, { type: 'square', from: 220, to: 60, duration: 0.1, gain: 0.25 })
    noise(ac, out, { from: 2500, q: 0.8, duration: 0.05, gain: 0.3 })
  },
  crit: (ac, out) => {
    tone(ac, out, { type: 'square', from: 260, to: 50, duration: 0.16, gain: 0.3 })
    noise(ac, out, { from: 3500, q: 0.8, duration: 0.08, gain: 0.35 })
    tone(ac, out, { type: 'triangle', from: 1760, to: 1320, start: 0.02, duration: 0.25, gain: 0.18 })
  },
  monsterDeath: (ac, out) => {
    tone(ac, out, { type: 'sawtooth', from: 420, to: 70, duration: 0.35, gain: 0.18 })
    noise(ac, out, { from: 1200, to: 200, q: 0.7, duration: 0.3, gain: 0.25 })
  },
  pickup: (ac, out) => arpeggio(ac, out, [880, 1320], 0.06, 'sine', 0.2),
  levelup: (ac, out) => arpeggio(ac, out, [523, 659, 784, 1047, 1319], 0.08),
  questComplete: (ac, out) => arpeggio(ac, out, [659, 784, 988, 1319], 0.1),
  damage: (ac, out) => {
    tone(ac, out, { type: 'sawtooth', from: 160, to: 45, duration: 0.22, gain: 0.22 })
    noise(ac, out, { from: 800, q: 0.6, duration: 0.1, gain: 0.25 })
  },
  dodge: (ac, out) => noise(ac, out, { from: 300, to: 1400, q: 1.2, duration: 0.22, gain: 0.3 }),
  perfectDodge: (ac, out) => {
    tone(ac, out, { type: 'sine', from: 1200, to: 2400, duration: 0.18, gain: 0.15 })
    tone(ac, out, { type: 'sine', from: 1800, to: 3600, start: 0.05, duration: 0.18, gain: 0.1 })
  },
  jump: (ac, out) => tone(ac, out, { type: 'sine', from: 280, to: 620, duration: 0.12, gain: 0.18 }),
  doubleJump: (ac, out) => {
    tone(ac, out, { type: 'sine', from: 420, to: 980, duration: 0.14, gain: 0.16 })
    noise(ac, out, { from: 1500, to: 4000, q: 1, duration: 0.15, gain: 0.15 })
  },
  land: (ac, out) => {
    tone(ac, out, { type: 'sine', from: 120, to: 40, duration: 0.12, gain: 0.3 })
    noise(ac, out, { from: 500, q: 0.6, duration: 0.1, gain: 0.2 })
  },
  heavy: (ac, out) => {
    noise(ac, out, { from: 250, to: 2200, q: 1.2, duration: 0.28, gain: 0.45 })
    tone(ac, out, { type: 'sawtooth', from: 90, to: 180, duration: 0.25, gain: 0.12 })
  },
  slam: (ac, out) => {
    tone(ac, out, { type: 'sine', from: 140, to: 30, duration: 0.45, gain: 0.5 })
    noise(ac, out, { from: 900, to: 150, q: 0.5, duration: 0.4, gain: 0.4 })
  },
  chargeReady: (ac, out) => {
    tone(ac, out, { type: 'triangle', from: 880, duration: 0.12, gain: 0.15 })
    tone(ac, out, { type: 'triangle', from: 1320, start: 0.06, duration: 0.18, gain: 0.15 })
  },
  enemyWarn: (ac, out) => tone(ac, out, { type: 'square', from: 700, to: 900, duration: 0.08, gain: 0.06 }),
  orb: (ac, out) => tone(ac, out, { type: 'sine', from: 1200 + Math.random() * 400, to: 2200, duration: 0.09, gain: 0.1 }),
  death: (ac, out) => arpeggio(ac, out, [392, 330, 262, 196], 0.18, 'triangle', 0.2),
  uiOpen: (ac, out) => tone(ac, out, { type: 'sine', from: 520, to: 780, duration: 0.07, gain: 0.12 }),
  uiClose: (ac, out) => tone(ac, out, { type: 'sine', from: 600, to: 400, duration: 0.07, gain: 0.12 }),
}

export function playSynth(key, volume) {
  const recipe = RECIPES[key]
  if (!recipe) return
  try {
    const ac = getContext()
    if (!ac) return
    const out = ac.createGain()
    out.gain.value = volume
    out.connect(ac.destination)
    recipe(ac, out)
  } catch {
    // Web Audio unavailable - stay silent
  }
}
