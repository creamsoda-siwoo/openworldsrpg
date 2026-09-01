import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import { Stats } from '@react-three/drei'
import ThirdPersonCamera from './components/camera/ThirdPersonCamera'
import PlayerController from './components/player/PlayerController'
import Terrain from './components/world/Terrain'
import Scenery from './components/world/Scenery'
import DayNightCycle from './components/world/DayNightCycle'
import Monsters from './components/world/Monsters'
import ItemPickups from './components/world/ItemPickups'
import NPC from './components/world/NPC'
import WarpCrystals from './components/world/WarpCrystals'
import Projectiles from './components/world/Projectiles'
import Minimap from './components/ui/Minimap'
import Crosshair from './components/ui/Crosshair'
import HUD from './components/ui/HUD'
import QuestTracker from './components/ui/QuestTracker'
import Inventory from './components/ui/Inventory'
import DialogueBox from './components/ui/DialogueBox'
import InteractPrompt from './components/ui/InteractPrompt'
import SystemMenu from './components/ui/SystemMenu'
import WorldMap from './components/ui/WorldMap'
import StoryIntro from './components/ui/StoryIntro'
import Toast from './components/ui/Toast'
import useUIKeyboardShortcuts from './hooks/useUIKeyboardShortcuts'
import useAutoSave from './hooks/useAutoSave'
import useBackgroundMusic from './hooks/useBackgroundMusic'

export default function App() {
  const controlsRef = useRef()
  useUIKeyboardShortcuts()
  useAutoSave()
  useBackgroundMusic()

  return (
    <div
      style={{ width: '100vw', height: '100vh', position: 'relative' }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <Canvas shadows camera={{ position: [0, 5, 8], fov: 60 }}>
        <DayNightCycle />

        <Physics gravity={[0, -9.81, 0]} broadphase="SAP">
          <Terrain />
          <Scenery />
          <Monsters />
          <ItemPickups />
          <NPC />
          <WarpCrystals />
          <Projectiles />
          <PlayerController controlsRef={controlsRef} />
        </Physics>

        <ThirdPersonCamera ref={controlsRef} />
        <Stats />
      </Canvas>

      <HUD />
      <QuestTracker />
      <Minimap />
      <InteractPrompt />
      <Inventory />
      <DialogueBox />
      <SystemMenu />
      <WorldMap />
      <Toast />
      <StoryIntro />
      <Crosshair />

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          color: 'white',
          fontSize: 13,
          background: 'rgba(0,0,0,0.5)',
          padding: '10px 14px',
          borderRadius: 8,
          lineHeight: 1.6,
          pointerEvents: 'none',
        }}
      >
        WASD: 이동 | Space: 점프 | 좌클릭: 공격 | 우클릭 드래그: 카메라 회전 | 스크롤: 줌 | E: 상호작용 | I: 인벤토리 | M: 지도 | P: 메뉴
      </div>
    </div>
  )
}
