import { useStatsStore } from '../store/useStatsStore'
import { useInventoryStore } from '../store/useInventoryStore'
import { useQuestStore } from '../store/useQuestStore'
import { useWorldProgressStore } from '../store/useWorldProgressStore'
import { useWorldStore } from '../store/useWorldStore'

const SAVE_KEY = 'openworldrpg-save-v1'

export function saveGame() {
  const stats = useStatsStore.getState()
  const inventory = useInventoryStore.getState()
  const quest = useQuestStore.getState()
  const worldProgress = useWorldProgressStore.getState()
  const world = useWorldStore.getState()

  const data = {
    version: 1,
    savedAt: Date.now(),
    stats: {
      level: stats.level,
      exp: stats.exp,
      expToNext: stats.expToNext,
      maxHealth: stats.maxHealth,
      health: stats.health,
      maxStamina: stats.maxStamina,
      stamina: stats.stamina,
    },
    inventory: {
      items: inventory.items,
      gold: inventory.gold,
      equippedWeaponId: inventory.equippedWeaponId,
    },
    quest: {
      active: quest.active,
      completed: quest.completed,
    },
    worldProgress: {
      defeatedMonsterIds: worldProgress.defeatedMonsterIds,
      collectedItemIds: worldProgress.collectedItemIds,
    },
    timeOfDay: world.timeOfDay,
  }

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function loadGame() {
  let raw
  try {
    raw = localStorage.getItem(SAVE_KEY)
  } catch {
    return false
  }
  if (!raw) return false

  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return false
  }

  if (data.stats) useStatsStore.setState(data.stats)
  if (data.inventory) {
    useInventoryStore.setState({
      items: data.inventory.items ?? {},
      gold: data.inventory.gold ?? 0,
      equippedWeaponId: data.inventory.equippedWeaponId ?? null,
    })
  }
  if (data.quest) {
    useQuestStore.setState({
      active: data.quest.active ?? {},
      completed: data.quest.completed ?? {},
    })
  }
  if (data.worldProgress) {
    useWorldProgressStore.setState({
      defeatedMonsterIds: data.worldProgress.defeatedMonsterIds ?? [],
      collectedItemIds: data.worldProgress.collectedItemIds ?? [],
    })
  }
  if (typeof data.timeOfDay === 'number') {
    useWorldStore.setState({ timeOfDay: data.timeOfDay })
  }

  return true
}

export function hasSaveGame() {
  try {
    return Boolean(localStorage.getItem(SAVE_KEY))
  } catch {
    return false
  }
}

export function clearSaveGame() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    // ignore
  }
}
