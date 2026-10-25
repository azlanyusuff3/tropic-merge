# Monster Island v17.0 verification — 25 October 2026

Baseline: `b5f39ee` from main. `merge.html` is unchanged byte-for-byte (SHA-256 `4a7dd28b2258f82222bff3a5d37319cebd9b81d7fe1fee411aedd121cfbe9441`), as are all eleven monster sprites, the Merge background, icons and the manifest (18 files checked by SHA-256 before and after).

`npm test` (50 checks, all passing) runs four suites.

## Simulation (`tests/sling-model.cjs`, `tests/sling-levels.mjs`)

- All 30 forts stand on their own for four seconds: no drift over 6 units, no tilt, no free kills, finite physics.
- All 30 levels are cleared by stored shot lists (`tests/sling-solutions.json`) that only use heroes guaranteed at that point of the campaign. The offline solver (`npm run solve`) found a winning first shot for every level; real players will normally need more.
- Trajectory preview is identical to the simulated flight (same integrator, same release point).
- All 11 skills fire once per launch and end their flight; short drags cost nothing; missed launches end in a clear defeat; victory bonus is applied once; saves are monotonic, merge across tabs, recover from backups and never write Merge keys.

## Browser (`tests/sling.cjs`, headless Chromium, real touch via CDP, real service worker)

- Island menu keeps both games; adventure map has 30 nodes, 5 boss destinations, locks, level card and squad picker.
- 320×568, 390×844, 430×932, 768×1024, 844×390: the canvas fills the viewport, no page scroll or page header, HUD inside the screen without overlaps, loaded monster radius ≥ 19 px and bandit radius ≥ 14 px, hero/skill buttons never cover a bandit in the aim or fort views.
- Touch drag aims with the camera frozen; release launches; camera follows, holds on the impact and returns to the sling.
- Dotted preview matches the live flight in the page (max error 0 world units).
- A second finger turns an aim into a pinch without launching; touch cancel, rotating mid-drag, backgrounding mid-drag and tiny pulls never launch.
- One-finger pan, pinch zoom within limits, wheel zoom and the recenter button.
- All 11 heroes picked from the tray, launched by drag and fired from the skill button with ready/used states and effects.
- A recorded solution topples real structures, wins with stars, unlocks the next level and survives reload; Merge keys untouched.
- Defeat retries instantly; the 4th clear shows the Sproutiball unlock celebration.
- Backgrounding pauses with an overlay and freezes physics; resume, help and keyboard pause.
- Rotation mid-level resizes the stage and camera; play continues.
- 30 restarts: one animation loop, no heap growth after GC, input still responsive.
- Reduced motion: no shake, lighter particles.
- Upgrade from the previous release `b5f39ee`: progress kept, only this game's old caches removed, unrelated caches kept; then menu, a Sling level and Merge all run offline.
- No console errors, page errors or failed requests.

## Monster Merge regression (`tests/playable.cjs`)

All original checks pass unchanged: merges, Infernodon explosion, Bomb, Shake, collisions, scoring, game over, animation and faces, collection, touch input, layouts, offline.

## Visual review

Screenshots of the map, level card, squad, every test size (intro and aim), aiming, flight, impact, skills, victory, unlock, defeat, pause, help, zoom, rotation and offline play are written to `test-output/` and were inspected. Two real-input gameplay recordings (landscape level 7, portrait boss level 6 with a skill) were captured with the CDP screencast and both ended in a win.

## Limits

- Frame timing was measured only in headless Chromium with software rendering on a 2-core container (about 21 ms average, 33 ms p95 per frame while aiming and flying). This is not a phone measurement; real device frame rates, GPU behaviour and battery use have not been measured. The game lowers resolution and particle counts automatically if frames run slow.
- Touch was emulated through Chrome DevTools; physical Android/iOS gestures, the system back gesture, display cutouts and installed-PWA behaviour were not tried on a real device.
- Audio is synthesised with Web Audio and was not listened to on devices.
- Level difficulty for human players was not play-tested; the solver only proves each level can be won.
- Browser full screen is offered only where the Fullscreen API exists (not on iPhone Safari); the game is fullscreen through its layout regardless.
- Progress is stored per browser; there is no cloud sync.
