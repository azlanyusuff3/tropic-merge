# Monster Sling v18.0

A fullscreen 2D slingshot game that lives next to the original Monster Merge on Monster Island.

## Play

Open Monster Sling from the island menu to reach the title screen: big PLAY (continues the next level), Monsters (hero squad), Islands (campaign map) and Settings. The campaign is an adventure map of five islands, each with a winding route of six levels that ends in a boss fort. Tap a level for its card (best stars, best score, hero) and press Play.

Each level opens with a short camera pan over the enemy fort before returning to the sling, where your hero hops into the pouch. Grab the monster, pull back and release. Dotted trails show the exact flight path. Tap anywhere (or the skill button, or Space) during flight to fire your hero's skill once. Defeat every shell bandit to rescue the crystal.

Normal levels give four monsters, boss levels five. Two spare monsters earn three stars, one spare earns two, none earns one. Best score and stars per level are kept and never decrease.

The hero tray (bottom-left portrait) opens between shots. Slimelet, Bubblo and Rockro start unlocked; Puffling, Sproutiball, Frostbop, Shadebub, Groveling, Tidalon, Lumiorb and Infernodon join after 2, 4, 7, 10, 13, 16, 20 and 25 cleared levels, with a celebration on the victory card. A species discovered in Monster Merge is unlocked here too (Merge storage is only read).

## Controls and camera

- **Aim:** touch inside a generous circle around the loaded monster and drag. The pull is measured in world space and the camera stays still while you drag. A tiny pull, dragging back to the fork, a second finger, a cancelled touch, rotating the device or leaving the app never launches.
- **Look around:** drag anywhere else to pan, pinch (or mouse wheel) to zoom within limits, and tap the target button to recenter.
- **Camera:** intro pan over the fort → aiming view → smooth flight tracking (and it keeps the fort in frame where it fits) → impact hold while the fort collapses → return to the sling. Landscape is recommended: the first portrait level of each session shows a card offering to rotate (automatic where the browser allows, otherwise it asks you to turn the phone; turning it closes the card). In portrait the camera frames the sling instead of shrinking the whole level, a live **TARGET** window shows the fort with the trajectory and predicted impact while you aim, and the impact view eases out to fit the fort. Pause also offers a Landscape button in portrait.
- **Pause:** top-left button, Escape or P. Pause holds resume, restart, map, how-to-play, sound, calm effects and optional browser full screen. Leaving the app pauses automatically.

## Hero skills

Slimelet jelly dash, Bubblo bubble blast, Puffling feather gust, Sproutiball seed burst (three physical seeds), Rockro boulder smash, Frostbop freeze (weakens nearby blocks to a quarter), Shadebub shadow slip (phases through for 0.8 s), Groveling root quake, Tidalon tidal wave, Lumiorb star seeker (re-aims at the nearest bandit) and Infernodon inferno blast. Each has its own particles, sound, monster reaction and, for the three heavy skills, a short screen shake (off with reduced motion or calm effects).

## Levels

Thirty hand-built forts in `sling/levels.js`, one function each: Sunlit Shores teaches aiming and toppling, Bamboo Bluffs adds tall towers, bridges, stairs and a domino row, Frost Lagoon brings glass huts, a glass pyramid, a stone shield and shelves, Twilight Grove hides heavy roofs, a balancing plank and a bunker, and Ember Summit builds stone keeps, three peaks and the final overlord. Every sixth level is a boss with a crowned, armoured bandit and an HP bar.

`tests/sling-solutions.json` stores a winning shot list for every level that only uses heroes guaranteed at that point in the campaign. `npm run solve` (slow, offline) regenerates it after layout changes; `tests/sling-levels.mjs` replays it in every test run and also checks that each fort stands on its own.

## Architecture

| File | Role |
| --- | --- |
| `sling.html` | Shell page for the map and the stage |
| `sling/app.js` | Map, level card, squad, fullscreen stage, camera, gestures, HUD, tray, pause/results, synthesised audio |
| `sling/art.js` | Island scenery layers, material sprites with damage stages, shell bandits, sling, crystal, pooled particles and skill effects |
| `sling/renderer.js` | Separate copy of the Merge monster rig (breathing, blinking, eyes, moods, jelly), with larger sprite caches and squash/mood hooks |
| `sling/battle.js` | Turns, damage, skills, scoring, events for effects and sound; no DOM or randomness |
| `sling/physics.js` | Independent box/circle solver: two-point box footings, material friction, sleeping bodies, and the shared integrator used by the trajectory preview |
| `sling/levels.js` | The 30 fort layouts and material table |
| `sling/data.js` | Species, islands, campaign list and saves |

Why the solver changed: the previous one gave box stacks a single contact point, so tall towers slowly tipped over by themselves (three-tier towers fell before the first shot). Stacked blocks now get a two-point footing solved symmetrically, and still bodies sleep until something moving touches them, a neighbour breaks or a skill reaches them. Collapses therefore come only from real impacts. No third-party engine or framework was added.

Rendering: the world is drawn on one canvas with a fixed 60 Hz simulation step. Scenery layers, block textures, bandit shells and monster sprites are generated once and cached; the backing store is capped at 2× device pixels and about 2.4 million pixels; particle budgets drop with reduced motion, calm effects, or if frames run slow. The loop stops when you leave a level and pauses when the page is hidden; all listeners of a level are removed when it ends.

## Storage

`monsterSlingSaveV1` keeps results, selected hero, sound, effects preference and whether the tutorial was seen; `monsterSlingBackupV1` keeps the previous valid copy. Existing saves load unchanged (new fields are optional). Results merge by maximum across tabs. Monster Merge keys are never written.

## Art direction

v18 restyles every Sling screen as a bright island mobile game: navy glass HUD panels with thick outlines (level badge with island avatar, defeated-bandit bar and reachable stars, score, objective panel, Next hero cards, skill card with a use badge), chunky glossy yellow/green/navy buttons, the Fredoka typeface (self-hosted, SIL OFL, `assets/fonts/`), sea cliffs with waterfalls and rocky islets, thick grass over a stone cliff face, soft-focus corner leaves, a thick wooden sling with red bands, crates with cross braces, bright glass and a dashed trajectory with a target reticle. There is no currency, shop or purchase.

## Artwork

The eleven original monster sprites, icons and Merge background are unchanged. Island scenery, terrain, wood/stone/glass, shell bandits and the boss, the sling, crystal, particles, map islands and UI icons are original procedural Canvas, SVG and CSS artwork created for Sling.
