import ItemPickup from './ItemPickup'
import { ITEM_SPAWNS } from '../../utils/itemSpawns'

export default function ItemPickups() {
  return (
    <>
      {ITEM_SPAWNS.map((spawn) => (
        <ItemPickup key={spawn.id} id={spawn.id} itemId={spawn.itemId} position={spawn.position} />
      ))}
    </>
  )
}
