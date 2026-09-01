export default function SwordMesh() {
  return (
    <group>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.07, 0.7, 0.02]} />
        <meshStandardMaterial color="#e8ecf2" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.04, 0]} castShadow>
        <boxGeometry args={[0.22, 0.04, 0.04]} />
        <meshStandardMaterial color="#7a1f1f" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.1, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.22, 8]} />
        <meshStandardMaterial color="#2a1c10" />
      </mesh>
    </group>
  )
}
