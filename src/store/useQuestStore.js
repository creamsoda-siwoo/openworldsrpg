import { create } from 'zustand'
import { QUESTS } from '../data/quests'
import { useStatsStore } from './useStatsStore'
import { useInventoryStore } from './useInventoryStore'
import { useToastStore } from './useToastStore'
import { useAudioStore } from './useAudioStore'

function findQuest(id) {
  return QUESTS.find((q) => q.id === id)
}

export const useQuestStore = create((set, get) => ({
  active: {}, // questId -> progress count
  completed: {}, // questId -> true

  acceptQuest: (questId) => {
    const { active, completed } = get()
    if (active[questId] !== undefined || completed[questId]) return
    set({ active: { ...active, [questId]: 0 } })
    const quest = findQuest(questId)
    if (quest) useToastStore.getState().push(`퀘스트 수락: ${quest.title}`)
  },

  reportCollect: (itemId, totalOwned) => {
    const { active, completed } = get()
    Object.keys(active).forEach((questId) => {
      const quest = findQuest(questId)
      if (!quest || quest.type !== 'collect' || quest.itemId !== itemId) return
      const progress = Math.min(quest.targetCount, totalOwned)
      set((s) => ({ active: { ...s.active, [questId]: progress } }))
      if (progress >= quest.targetCount) get().completeQuest(questId)
    })
  },

  reportDefeat: (monsterType) => {
    const { active } = get()
    Object.keys(active).forEach((questId) => {
      const quest = findQuest(questId)
      if (!quest || quest.type !== 'defeat' || quest.monsterType !== monsterType) return
      const progress = Math.min(quest.targetCount, active[questId] + 1)
      set((s) => ({ active: { ...s.active, [questId]: progress } }))
      if (progress >= quest.targetCount) get().completeQuest(questId)
    })
  },

  reportDiscover: (totalDiscovered) => {
    const { active } = get()
    Object.keys(active).forEach((questId) => {
      const quest = findQuest(questId)
      if (!quest || quest.type !== 'discover') return
      const progress = Math.min(quest.targetCount, totalDiscovered)
      set((s) => ({ active: { ...s.active, [questId]: progress } }))
      if (progress >= quest.targetCount) get().completeQuest(questId)
    })
  },

  completeQuest: (questId) => {
    const quest = findQuest(questId)
    if (!quest) return
    const { active, completed } = get()
    if (completed[questId]) return

    const nextActive = { ...active }
    delete nextActive[questId]
    set({ active: nextActive, completed: { ...completed, [questId]: true } })

    useAudioStore.getState().playSound('questComplete')
    useToastStore.getState().push(`퀘스트 완료: ${quest.title}`)

    const { reward } = quest
    if (reward.exp) useStatsStore.getState().gainExp(reward.exp)
    if (reward.gold) useInventoryStore.getState().addGold(reward.gold)
    if (reward.itemId) useInventoryStore.getState().addItem(reward.itemId, 1)
  },
}))
