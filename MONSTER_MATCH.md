# Monster Match - Classic Endless

Monster Match is a third independent Monster Island game. Monster Merge (`merge.html`) and Monster Sling (`sling.html`) engines, assets, and stored progress remain unchanged.

## Gameplay

An 8x8 puzzle of six familiar monster faces. Swipe a monster to swap it with its neighbor, or tap two adjacent monsters. Match three or more of one kind horizontally or vertically; matches vanish, gravity refills the board, cascades score extra points. There are no turns, time limits, lives, or paid resources.

- Match four to produce a row or column blast; match five to produce a rainbow clear.
- T/L-shaped matches produce a 3x3 bomb.
- Swap a power piece to trigger it. Multiple effects can chain.
- No moves left? The board automatically reshuffles without losing score.
- Hint highlights one playable swap, and Shuffle starts a fresh board without erasing score.
- New Game starts over while retaining the all-time best.
- Optional sound is off by default.

The pure, deterministic rules and generator are in `match/engine.mjs`; the UI is `match.html`, `match/app.js` and `match/style.css`. The original six WebP assets and tropical background are reused with no duplicate images or new dependencies. Progress saves to `monsterMatchSaveV1` and `monsterMatchBestV1` without touching any Monster Merge or Monster Sling keys. The service worker caches all required pages for offline play.

## Verification

Run `npm run test:match` for the model tests and the Playwright browser check across four screen sizes (320x568, 390x844, 430x932, 768x1024), touch input, images, persistence and reset. `npm test` also runs the existing Merge and Sling suites.

The implementation was exercised in isolated headless Chromium (using placeholder monster art) and with 334 engine checks. Real Android GPU performance, system gestures, audio and installed-PWA behavior still need device verification.
