# Audio assets

Drop files with these exact names in this folder to enable sound - no code
changes needed, `src/audio/sounds.js` already points here. Any effect without
a file falls back to a synthesized sound (`src/audio/synth.js`), so the game
is never silent; a real file always takes priority.

Sound effects (short one-shot clips):
- attack.mp3 - player melee swing
- hit.mp3 - melee hit lands on a monster
- monster-death.mp3 - monster defeated
- pickup.mp3 - item added to inventory
- levelup.mp3 - player levels up
- quest-complete.mp3 - quest turned in / auto-completed
- damage.mp3 - player takes damage
- jump.mp3 - player jumps
- death.mp3 - player health hits zero
- ui-open.mp3 / ui-close.mp3 - menu/dialogue/inventory toggle

Music (looping):
- bgm.mp3 - background music, starts on the player's first click/keypress
  (required by browser autoplay policy)
