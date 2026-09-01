import Monster from './Monster'
import { MONSTER_SPAWNS } from '../../utils/monsterSpawns'

export default function Monsters() {
  return (
    <>
      {MONSTER_SPAWNS.map((spawn) => (
        <Monster key={spawn.id} id={spawn.id} spawnPosition={spawn.position} />
      ))}
    </>
  )
}
