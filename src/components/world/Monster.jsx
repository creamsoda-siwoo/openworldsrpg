import Enemy from './Enemy'

// Slow, bouncy starter enemy: long telegraph and a hopping lunge, so it's a
// forgiving place to learn the dodge timing.
const SLIME = {
  kind: 'slime',
  name: '슬라임',
  detectRange: 9,
  attackRange: 2.2,
  speed: 2.4,
  wanderSpeed: 1,
  wanderRadius: 6,
  attackDamage: 6,
  windup: 0.6,
  lungeSpeed: 7,
  lungeDuration: 0.35,
  lungeHop: 0.9,
  recover: 0.8,
  maxHealth: 30,
  bodyHalfHeight: 0.35,
  hpBarHeight: 0.9,
  expReward: 15,
  respawnDelayMs: 60_000,
  dropItem: 'slimeGel',
  burstColor: '#5fd67a',
}

export default function Monster({ id, spawnPosition }) {
  return (
    <Enemy id={id} spawnPosition={spawnPosition} config={SLIME}>
      <mesh castShadow scale={[1, 0.7, 1]}>
        <sphereGeometry args={[0.5, 12, 10]} />
        <meshStandardMaterial color="#5fd67a" transparent opacity={0.92} roughness={0.4} />
      </mesh>
      <mesh position={[-0.15, 0.15, 0.4]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.15, 0.15, 0.4]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </Enemy>
  )
}
