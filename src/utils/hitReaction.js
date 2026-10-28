// Per-enemy hit feedback: a brief white flash, a knockback shove away from the
// attacker, a squash-and-stretch wobble, a short stagger that pauses the
// enemy's AI (which also interrupts an attack it was winding up), and - for
// launching hits - an airborne arc. Hitting an enemy that's still airborne
// pops it back up, so launches can be juggled.

const KNOCKBACK_SPEED = 7
const CRIT_KNOCKBACK_SPEED = 11
const KNOCKBACK_DECAY = 12
const STAGGER_SECONDS = 0.18
const CRIT_STAGGER_SECONDS = 0.35
const FLASH_SECONDS = 0.12
const LAUNCH_VELOCITY = 7.5
const JUGGLE_VELOCITY = 5
const GRAVITY = 20

export function createHitReaction() {
  return { flash: 0, stagger: 0, wobble: 0, vx: 0, vz: 0, air: 0, vy: 0 }
}

// `stagger: false` lets super-armored enemies (elites) take the shove and
// flash without having their attack interrupted.
export function triggerHitReaction(reaction, from, target, { crit = false, launch = false, stagger = true } = {}) {
  let dx = target[0] - (from?.[0] ?? target[0])
  let dz = target[2] - (from?.[2] ?? target[2])
  const len = Math.hypot(dx, dz)
  if (len > 0.001) {
    dx /= len
    dz /= len
  } else {
    dx = 0
    dz = 0
  }
  const speed = crit || launch ? CRIT_KNOCKBACK_SPEED : KNOCKBACK_SPEED
  reaction.vx = dx * speed
  reaction.vz = dz * speed
  reaction.flash = FLASH_SECONDS
  reaction.wobble = 1
  if (stagger) reaction.stagger = crit || launch ? CRIT_STAGGER_SECONDS : STAGGER_SECONDS
  if (launch) reaction.vy = Math.max(reaction.vy, LAUNCH_VELOCITY)
  else if (reaction.air > 0) reaction.vy = Math.max(reaction.vy, JUGGLE_VELOCITY)
}

export function isAirborne(reaction) {
  return reaction.air > 0 || reaction.vy > 0
}

// Applies the reaction to the enemy's group for this frame (horizontal shove,
// scale, flash) and integrates the airborne height into `reaction.air`, which
// the caller adds to the enemy's ground height. Returns true while the enemy
// is staggered or airborne so the caller can skip its AI.
export function stepHitReaction(reaction, group, delta) {
  const pos = group.position
  pos.x += reaction.vx * delta
  pos.z += reaction.vz * delta
  const decay = Math.exp(-KNOCKBACK_DECAY * delta)
  reaction.vx *= decay
  reaction.vz *= decay

  if (isAirborne(reaction)) {
    reaction.vy -= GRAVITY * delta
    reaction.air += reaction.vy * delta
    if (reaction.air <= 0) {
      reaction.air = 0
      reaction.vy = 0
    }
  }

  if (reaction.wobble > 0) {
    reaction.wobble = Math.max(0, reaction.wobble - delta * 4)
    const w = Math.sin(reaction.wobble * Math.PI * 3) * reaction.wobble * 0.3
    group.scale.set(1 + w, 1 - w, 1 + w)
  } else {
    group.scale.set(1, 1, 1)
  }

  const wasFlashing = reaction.flash > 0
  if (wasFlashing) reaction.flash -= delta
  const flashing = reaction.flash > 0
  if (wasFlashing || flashing) setFlash(group, flashing)

  if (reaction.stagger > 0) reaction.stagger -= delta
  return reaction.stagger > 0 || isAirborne(reaction)
}

function setFlash(group, on) {
  group.traverse((obj) => {
    const mat = obj.material
    if (!mat || !mat.emissive) return
    if (!mat.userData.baseEmissive) {
      mat.userData.baseEmissive = mat.emissive.clone()
      mat.userData.baseEmissiveIntensity = mat.emissiveIntensity
    }
    if (on) {
      mat.emissive.setRGB(1, 1, 1)
      mat.emissiveIntensity = 0.9
    } else {
      mat.emissive.copy(mat.userData.baseEmissive)
      mat.emissiveIntensity = mat.userData.baseEmissiveIntensity
    }
  })
}
