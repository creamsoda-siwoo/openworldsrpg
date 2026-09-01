import HumanCharacter from '../character/HumanCharacter'

export default function PlayerModel({ speedRef, groundOffset = 0 }) {
  return (
    <group position={[0, groundOffset, 0]}>
      <HumanCharacter speedRef={speedRef} />
    </group>
  )
}
