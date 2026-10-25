# Monster Merge verification — 25 October 2026

Tested the actual application in headless Chromium 153 using Playwright 1.62.1. The suite serves this repository locally. Test-only state inspection is injected by the test runner; the shipped page exposes no debug controls. Offline checks run against the unmodified page with a real service worker and network disabled.

## Passed

- 11 decoded sprites and legacy best-score preservation
- Real touch drop and gravity
- All 10 merge transitions, radius progression and scoring
- Coincident unequal objects separate without NaN
- Legendary level cap stays at 11
- Consecutive merge multiplier: 4 + 8 = 12
- Bomb button, touch selection and one-monster removal
- Shake applies impulses without merging unlike monsters
- 10-second mixed pile simulation: finite positions, wall/floor containment
- Original danger timing, Game Over modal and Play Again
- Sound toggle state
- Restart confirmation clears board
- No page overflow or overlapping controls at 5 phone/tablet/desktop sizes
- Drag-and-release world coordinate mapping
- Actual running board after 19 interactive drops
- Drops keep working after Shake/Bomb pressed mid-aim (two-finger regression)
- View Board: tapping the board brings Game Over back; zero score is not a personal best
- No browser JavaScript errors
- Real offline reload, play and 19 cached resources

Phone/tablet/desktop viewport sizes: 320×568, 390×844, 430×932, 768×1024 and 1440×900. Screenshots of all 11 sprites and the board after interactive drops were visually reviewed. All sprite files have alpha transparency and are 512×512. Artwork and icons total approximately 1 MB. Syntax and `git diff --check` also pass.

## Update delivery (v13.1.0)

The service worker installs every file with `cache: 'reload'`. Verified against a server sending GitHub Pages' `Cache-Control: max-age=600`: the previous worker re-cached the old `index.html` after an update, the new one picks up the new build. The start screen shows the running version.

## Changes to the original engine

The custom Canvas/JavaScript circle solver, radii, gravity, bounce, sleeping, random generation probabilities, merge values, combo window and danger timing are retained. Exact-center collision separation now uses a valid normal. Particle lifetimes continue after Game Over. Audio resumes after app suspension. The glass top and danger line move down 32 logical pixels together to reserve space for the new header and the largest preview; the floor and all monster radii remain unchanged.

## Reproduce

Run `npm install`, `npx playwright install chromium`, then `npm test`. A local test server starts automatically. Alternatively set `CHROMIUM_PATH` to an installed compatible Chromium executable. Screenshots and JSON results are written to ignored `test-output/`.

## Limits

No physical iPhone, Android phone or iPad was available; real-device Safari/audio behavior and device-specific frame rates have not been measured. Responsive tests use Chromium viewport/touch emulation. Visual assets are faithful practical recreations of the references, not pixel-identical copies; the logo and wooden/glass framing are responsive CSS/Canvas approximations. Offline play requires one successful initial online cache installation. Very short landscape screens use a compact layout; portrait is the primary game orientation.
