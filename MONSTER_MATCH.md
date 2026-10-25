# Monster Match — Classic Endless + Monster Evolution

Monster Match is the lightweight match-3 game in Monster Island. The home screen still displays only Monster Merge and Monster Match. Monster Sling remains hidden and is not deleted.

## Gameplay

- **Match 3:** clear three identical base monsters and earn points.
- **Match 4:** creates a horizontal or vertical blast as before.
- **Match 5 or more:** creates one **evolved monster** at the matched location. It stays on the board.
- **Swap evolved + normal:** trigger a **3×3 blast** centered on the evolved monster's new position.
- **Swap two evolved monsters:** trigger a **5×5 MEGA BLAST** centered on the first evolved monster's destination.
- Blast effects can chain-trigger other evolved monsters. T/L matches create the existing 3×3 bomb. Existing saved rainbow pieces remain usable; newly created Match 5 powers evolve instead.
- No level system, timer, lives, energy, rescue requirements, or external server. Classic Endless, hints, shuffling, high score, sound and automatic saves remain.

## Six normal tile kinds, five evolved monster identities

| Match 5 of | Evolved character |
|---|---|
| Slimelet | Groveling |
| Tidalon | Bubblo |
| Puffling | Shadebub |
| Sproutiball | Groveling |
| Rockro | Infernodon |
| Frostbop | Lumiorb |

All evolved monsters share the same explosion mechanics for this version. There are still only six normal matching colors on the 8×8 board. Evolved characters are special power tiles, not a seventh match color, and all 11 existing monster identities appear.

## Implementation and compatibility

Rules: `match/engine.mjs`. UI: `match/app.js`, `match/style.css`, `match.html`. Sprite paths for Tidalon and Frostbop remain Match-specific, while five evolved monster images reuse existing unchanged source sprites. No added assets, libraries, or large downloads are needed.

Existing local save keys `monsterMatchSaveV1` and `monsterMatchBestV1` remain unchanged. Previous valid board saves load as before. Evolved pieces store `special: "evolved"` and a validated `evolution` identity. The service worker cache version is updated for offline delivery, without affecting Monster Merge or un-hiding Sling.

Tests: `npm run test:match` for model and browser regressions, including all six evolution mappings, 3×3/5×5 blasts, chain reactions, old saves, simulated touch, and mobile layouts. Tested locally in headless Chromium; real-device PWA QA is still recommended.
