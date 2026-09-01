export default function BowMesh() {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.015, 6, 16, Math.PI * 1.3]} />
        <meshStandardMaterial color="#6b4a2f" roughness={0.7} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.003, 0.003, 0.42, 4]} />
        <meshStandardMaterial color="#dddddd" />
      </mesh>
    </group>
  )
}
