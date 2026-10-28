import Goblin from './Goblin'
import { GOBLIN_SPAWNS } from '../../utils/goblinSpawns'

export default function Goblins() {
  return (
    <>
      {GOBLIN_SPAWNS.map((spawn) => (
        <Goblin key={spawn.id} id={spawn.id} spawnPosition={spawn.position} />
      ))}
    </>
  )
}
