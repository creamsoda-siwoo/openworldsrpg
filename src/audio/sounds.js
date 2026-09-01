// Sound keys map to files under public/audio/. The files themselves are not
// included yet - drop matching audio files into public/audio/ and playback
// starts working immediately, no code changes needed. Missing files fail
// silently (see useAudioStore) so the game runs fine without them.
export const SOUNDS = {
  attack: '/audio/attack.mp3',
  hit: '/audio/hit.mp3',
  monsterDeath: '/audio/monster-death.mp3',
  pickup: '/audio/pickup.mp3',
  levelup: '/audio/levelup.mp3',
  questComplete: '/audio/quest-complete.mp3',
  damage: '/audio/damage.mp3',
  jump: '/audio/jump.mp3',
  death: '/audio/death.mp3',
  uiOpen: '/audio/ui-open.mp3',
  uiClose: '/audio/ui-close.mp3',
}

export const MUSIC = {
  bgm: '/audio/bgm.mp3',
}
