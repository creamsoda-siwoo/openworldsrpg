import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useCombatFxStore } from '../../store/useCombatFxStore'
import { usePlayerStore } from '../../store/usePlayerStore'
import { useStatsStore } from '../../store/useStatsStore'
import { useAudioStore } from '../../store/useAudioStore'
import { terrainHeightAt } from '../../utils/terrain'

const BURST_LIFETIME = 0.7
const BURST_GRAVITY = 14

const SHOCKWAVE_LIFETIME = 0.35

// Drop orbs pop out of a defeated enemy, bounce, then get pulled into the
// player once they've settled for a moment and the player is close enough.
const ORB_GRAVITY = 16
const ORB_BOUNCE = 0.45
const ORB_RADIUS = 0.15
const ORB_MAGNET_DELAY = 0.5
const ORB_MAGNET_RANGE = 9
const ORB_MAGNET_ACCEL = 40
const ORB_COLLECT_RADIUS = 0.8
const ORB_LIFETIME = 25
const ORB_HEAL = 5
const ORB_STAMINA = 12
const ORB_COLORS = { heal: '#ff5a6e', stamina: '#ffd54a' }

function Popup({ position, text, kind }) {
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`dmg-popup dmg-popup--${kind}`}>{text}</div>
    </Html>
  )
}

function Burst({ id, position, color, particles }) {
  const groupRef = useRef()
  const age = useRef(0)

  useFrame((_, delta) => {
    age.current += delta
    if (age.current > BURST_LIFETIME) {
      useCombatFxStore.getState().removeBurst(id)
      return
    }
    const t = age.current
    const shrink = 1 - t / BURST_LIFETIME
    groupRef.current?.children.forEach((mesh, i) => {
      const p = particles[i]
      mesh.position.set(p.vx * t, p.vy * t - 0.5 * BURST_GRAVITY * t * t, p.vz * t)
      mesh.scale.setScalar(p.size * shrink)
    })
  })

  return (
    <group ref={groupRef} position={position}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function Shockwave({ id, position, radius, color }) {
  const meshRef = useRef()
  const age = useRef(0)

  useFrame((_, delta) => {
    age.current += delta
    if (age.current > SHOCKWAVE_LIFETIME) {
      useCombatFxStore.getState().removeShockwave(id)
      return
    }
    const t = age.current / SHOCKWAVE_LIFETIME
    const ease = 1 - (1 - t) * (1 - t)
    if (meshRef.current) {
      meshRef.current.scale.setScalar(0.2 + ease * radius)
      meshRef.current.material.opacity = 0.8 * (1 - t)
    }
  })

  return (
    <mesh ref={meshRef} position={[position[0], position[1] + 0.1, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.85, 1, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} depthWrite={false} />
    </mesh>
  )
}

function Orb({ id, position, kind, velocity }) {
  const meshRef = useRef()
  const age = useRef(0)
  const vel = useRef([...velocity])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    age.current += delta
    if (age.current > ORB_LIFETIME) {
      useCombatFxStore.getState().removeOrb(id)
      return
    }

    const p = mesh.position
    const v = vel.current
    const [px, py, pz] = usePlayerStore.getState().position
    const tx = px - p.x
    const ty = py + 0.3 - p.y
    const tz = pz - p.z
    const dist = Math.hypot(tx, ty, tz)

    if (dist < ORB_COLLECT_RADIUS) {
      if (kind === 'heal') useStatsStore.getState().heal(ORB_HEAL)
      else useStatsStore.getState().regenStamina(ORB_STAMINA)
      useAudioStore.getState().playSound('orb')
      useCombatFxStore.getState().removeOrb(id)
      return
    }

    if (age.current > ORB_MAGNET_DELAY && dist < ORB_MAGNET_RANGE) {
      // Homing: accelerate toward the player and bleed off sideways drift so
      // the orb curves in rather than orbiting.
      const accel = ORB_MAGNET_ACCEL * delta
      v[0] = v[0] * 0.9 + (tx / dist) * accel
      v[1] = v[1] * 0.9 + (ty / dist) * accel
      v[2] = v[2] * 0.9 + (tz / dist) * accel
    } else {
      v[1] -= ORB_GRAVITY * delta
    }

    p.x += v[0] * delta
    p.y += v[1] * delta
    p.z += v[2] * delta

    const floor = terrainHeightAt(p.x, p.z) + ORB_RADIUS
    if (p.y < floor) {
      p.y = floor
      v[1] = Math.abs(v[1]) * ORB_BOUNCE
      v[0] *= 0.7
      v[2] *= 0.7
    }

    mesh.rotation.y += delta * 4
  })

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[ORB_RADIUS, 0]} />
      <meshStandardMaterial color={ORB_COLORS[kind]} emissive={ORB_COLORS[kind]} emissiveIntensity={0.9} />
    </mesh>
  )
}

export default function CombatEffects() {
  const [{ popups, bursts, orbs, shockwaves }, setFx] = useState(() => useCombatFxStore.getState())

  useEffect(() => useCombatFxStore.subscribe((s) => setFx(s)), [])

  return (
    <>
      {popups.map((p) => (
        <Popup key={p.id} {...p} />
      ))}
      {bursts.map((b) => (
        <Burst key={b.id} {...b} />
      ))}
      {orbs.map((o) => (
        <Orb key={o.id} {...o} />
      ))}
      {shockwaves.map((w) => (
        <Shockwave key={w.id} {...w} />
      ))}
    </>
  )
}
