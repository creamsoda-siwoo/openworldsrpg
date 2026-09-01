function hash2D(x, y, seed) {
  const h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123
  return h - Math.floor(h)
}

function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

export function valueNoise2D(x, y, seed = 0) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = x0 + 1
  const y1 = y0 + 1

  const sx = smoothstep(x - x0)
  const sy = smoothstep(y - y0)

  const n00 = hash2D(x0, y0, seed)
  const n10 = hash2D(x1, y0, seed)
  const n01 = hash2D(x0, y1, seed)
  const n11 = hash2D(x1, y1, seed)

  const ix0 = n00 + (n10 - n00) * sx
  const ix1 = n01 + (n11 - n01) * sx
  return ix0 + (ix1 - ix0) * sy
}

export function fbm2D(x, y, options = {}) {
  const { octaves = 4, frequency = 0.02, persistence = 0.5, lacunarity = 2, seed = 0 } = options
  let total = 0
  let amplitude = 1
  let freq = frequency
  let maxAmplitude = 0

  for (let i = 0; i < octaves; i++) {
    total += valueNoise2D(x * freq, y * freq, seed + i * 17.13) * amplitude
    maxAmplitude += amplitude
    amplitude *= persistence
    freq *= lacunarity
  }

  return total / maxAmplitude
}

export function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
