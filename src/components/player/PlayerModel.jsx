import HumanCharacter from '../character/HumanCharacter'

export default function PlayerModel({ speedRef, groundOffset = 0, equippedWeaponId, attackSignal }) {
  return (
    <group position={[0, groundOffset, 0]}>
      <HumanCharacter speedRef={speedRef} equippedWeaponId={equippedWeaponId} attackSignal={attackSignal} />
    </group>
  )
}
