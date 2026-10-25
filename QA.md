# Monster Island v16.0 verification — 25 October 2026

Baseline: `d9b8043` from main. Monster Merge's entire `merge.html` document is unchanged byte-for-byte, including navigation, styles, physics, sounds, sprites, collection, achievements and save formats. Background, sprite and icon binaries are unchanged. The existing Merge regression suite also checks original engine/CSS SHA-256 fingerprints.

## Automated checks

- Thirty generated campaign levels settle with finite rigid-body positions and no free enemy kills. Normal slingshot trajectories and Bubblo skills can clear all thirty levels within their ammunition budgets, without assigning victory or deleting enemies directly.
- All eleven hero skills, single-use limits, projectile flight termination, short-drag cancellation, finite physics, missed-shot defeat, damage-driven victory and one-time bonuses.
- Progression gates, read-only Merge unlock integration, best stars/scores, cross-tab result merging and validated backup recovery.
- Playwright: menu, campaign, real drag/release trajectory, ammo, skills, damage-driven win, next-level unlock, retry, zoom/pan controls, instructions, defeat, save/reload and document navigation.
- Responsive battle/map checks at 320×568, 390×844, 430×932, 768×1024 and 844×390. No horizontal overflow or overlapping action buttons. Portrait screens can scroll to the hero rack. Landscape offers a wider battlefield.
- Original Monster Merge regression suite: all merge transitions, Infernodon explosion, Bomb charges, Shake, collisions, combo/scoring, game-over/restart, monster faces/jelly animations, collection/goals, touch/drag input, NEXT scaling and offline operation.
- Offline smoke tests use unmodified production modules with a real installed service worker, browser networking disabled and the `/tropic-merge/` path. Menu, Sling battlefield and Merge start correctly. Unrelated application caches survive.
- No page/console errors or failed runtime assets in browser checks. Test-only state inspection is injected into served source by the runner and is not present in shipped modules. Browser reward tests position a projectile near a target before activating the real skill; model campaign checks use normal simulated trajectories.

Run `npm install`, `npx playwright install chromium`, then `npm test`. Set `CHROMIUM_PATH` for an existing compatible browser. Screenshots and JSON results go to ignored `test-output/`.

## Limits

Tests use headless Chromium and emulated touch/viewports. Physical Android/iOS installation gestures, device-specific audio and budget-phone frame rates have not been measured. The solver uses simple 2D rigid bodies, not a third-party commercial physics engine. Level progress is local to each browser. Active shots are paused when backgrounded; reloading an unfinished level restarts it. No cloud synchronization is included.
