import WarpCrystal from './WarpCrystal'
import { WARP_POINTS, VILLAGE_WARP_ID } from '../../utils/warpPoints'

export default function WarpCrystals() {
  return (
    <>
      {WARP_POINTS.filter((p) => p.id !== VILLAGE_WARP_ID).map((p) => (
        <WarpCrystal key={p.id} id={p.id} name={p.name} position={p.position} />
      ))}
    </>
  )
}
