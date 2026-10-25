# Monster Sling v16.0

An independent 2D slingshot puzzle game alongside the original Monster Merge.

## Play

Open Monster Sling from the island menu. Choose a hero, drag back and release. Pulling left and slightly down launches right and up. The dotted trajectory helps aim. Tap the battlefield or skill button during flight to activate a skill once. Defeat every shell bandit to recover the crystal. Aim at supports to topple the fort. Try again freely; there are no lives, timers or real-money purchases.

Thirty sequential levels cover five island themes, with a guardian boss every sixth level. Four launches are available in normal levels and five in boss levels. Complete a level with at least two spare launches for three stars, one spare launch for two stars, or no spare launches for one star. Best score and best star count are saved independently and never decrease.

Slimelet, Bubblo and Rockro start unlocked. More heroes unlock at 2, 4, 7, 10, 13, 16, 20 and 25 cleared levels. Discovering a species in Monster Merge also unlocks it here. All eleven original sprite designs are reused. Species IDs in `monsterMergeCodexV1` are read without modifying any Merge key. Sling progression is independent of Merge scoring and physics.

Skills: Slimelet jelly dash/bounce, Bubblo bubble blast, Puffling feather gust, Sproutiball seed projectiles, Rockro downward smash, Frostbop structure weakening/freezing, Shadebub temporary collision phasing, Groveling foundation quake, Tidalon sideways wave, Lumiorb targeted trajectory change, and Infernodon explosion.

Zoom in/out for precision and toggle the pan button to drag the world. The zoomed camera follows a flying monster. Portrait and landscape work; landscape provides a wider view. Next Monster lets a player end a shot after one second. A shot otherwise ends automatically after resting, leaving the battlefield or eight seconds. An exhausted squad gets a bounded settling period before defeat, preventing stuck rounds. Dialogs and backgrounding pause the simulation. Leaving the document stops the animation loop. Reloading restarts the current level; completed-level progress remains saved.

## Architecture and storage

`index.html`: island menu. `sling.html`: campaign and battlefield. `sling/data.js`: species, campaign and saves. `sling/physics.js`: independent oriented-box/circle collision solver with angular impulses, friction and substeps. `sling/battle.js`: turns, damage, hero skills, victory and defeat. `sling/renderer.js`: separate copy of the original visual monster rig, without any Merge engine. `sling/app.js`: UI, touch input, camera, rendering and audio.

`monsterSlingSaveV1` stores results, hero selection and sound settings. A previous valid snapshot is retained in `monsterSlingBackupV1`. Malformed saves fall back to the backup. Saves merge completed results by maximum score and stars, retaining progress from another tab. Storage errors display a visible notice. No account, backend, tracking, advertising or payments. Saves are local to the browser; clearing site data removes them.

All former virtual-pet gameplay, UI, resources, documentation and tests have been removed. Previously stored data from that removed mode is left unused; no automatic browser-storage deletion is performed. Existing Monster Merge keys are never cleared, rewritten or migrated by Sling.

The shared worker precaches every runtime file and sprite. Cache cleanup checks both project cache-name prefixes and every cached URL against the service-worker scope, protecting other applications on the same Pages account. Original icon files, manifest name/scope/start URL and Merge document remain compatible with installed PWAs.

## Artwork

Original eleven monster WebP sprites, island background and icons remain unchanged. Shell bandits, crystal, sling, wood/glass/stone structures, particles and game controls are original Canvas/CSS artwork. No extra image library or framework is required.
