import Enemy from './Enemy'

// Faster and more aggressive than the slime: bigger detection range, harder
// hits, and a quick low lunge with a short telegraph - a step up in threat
// once the player has cleared out the starting fields.
const GOBLIN = {
  kind: 'goblin',
  name: '고블린',
  detectRange: 12,
  attackRange: 2.4,
  speed: 3.6,
  wanderSpeed: 1.4,
  wanderRadius: 8,
  attackDamage: 10,
  windup: 0.4,
  lungeSpeed: 11,
  lungeDuration: 0.25,
  lungeHop: 0.25,
  recover: 0.55,
  maxHealth: 45,
  bodyHalfHeight: 0.55,
  hpBarHeight: 1.2,
  expReward: 30,
  respawnDelayMs: 90_000,
  dropItem: 'goblinFang',
  burstColor: '#5f8a44',
}

export default function Goblin({ id, spawnPosition }) {
  return (
    <Enemy id={id} spawnPosition={spawnPosition} config={GOBLIN}>
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.32]} />
        <meshStandardMaterial color="#4a6b3a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.52, 0.02]}>
        <boxGeometry args={[0.34, 0.32, 0.34]} />
        <meshStandardMaterial color="#5f8a44" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.19, 0.6, 0]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[0.08, 0.22, 6]} />
        <meshStandardMaterial color="#5f8a44" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.19, 0.6, 0]} rotation={[0, 0, 0.5]}>
        <coneGeometry args={[0.08, 0.22, 6]} />
        <meshStandardMaterial color="#5f8a44" roughness={0.9} />
      </mesh>
      <mesh position={[-0.09, 0.54, 0.17]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <meshStandardMaterial color="#c62828" emissive="#8a1414" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0.09, 0.54, 0.17]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <meshStandardMaterial color="#c62828" emissive="#8a1414" emissiveIntensity={0.7} />
      </mesh>
      <mesh castShadow position={[-0.32, 0.05, 0]} rotation={[0, 0, 0.25]}>
        <boxGeometry args={[0.14, 0.5, 0.16]} />
        <meshStandardMaterial color="#4a6b3a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.34, 0.1, 0]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.14, 0.5, 0.16]} />
        <meshStandardMaterial color="#4a6b3a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.46, -0.1, 0]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.14, 0.28, 0.14]} />
        <meshStandardMaterial color="#5c4530" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.16, -0.55, 0]}>
        <boxGeometry args={[0.17, 0.35, 0.2]} />
        <meshStandardMaterial color="#3a5230" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.16, -0.55, 0]}>
        <boxGeometry args={[0.17, 0.35, 0.2]} />
        <meshStandardMaterial color="#3a5230" roughness={0.9} />
      </mesh>
    </Enemy>
  )
}
