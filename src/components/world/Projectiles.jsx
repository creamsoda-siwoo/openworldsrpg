import { useEffect, useState } from 'react'
import Arrow from './Arrow'
import { useProjectileStore } from '../../store/useProjectileStore'

export default function Projectiles() {
  const [arrows, setArrows] = useState(useProjectileStore.getState().arrows)

  useEffect(() => useProjectileStore.subscribe((s) => setArrows(s.arrows)), [])

  return (
    <>
      {arrows.map((arrow) => (
        <Arrow key={arrow.id} id={arrow.id} position={arrow.position} direction={arrow.direction} damage={arrow.damage} />
      ))}
    </>
  )
}
