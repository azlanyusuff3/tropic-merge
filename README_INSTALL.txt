MONSTER ISLAND v18.1 - MONSTER MERGE + MONSTER SLING + MONSTER MATCH

Play: https://azlanyusuff3.github.io/tropic-merge/

The island menu offers three independent games.
Monster Merge: the original drop/merge game, preserved byte-for-byte in merge.html.
Monster Sling: a fullscreen slingshot adventure. Pull back your monster, release,
tap in flight for its skill, topple wood/stone/glass forts and rescue the crystal
across five islands and 30 levels.
Monster Match: Classic Endless 8x8 match-3 with familiar monster sprites,
cascades, row/column blasts, bombs, rainbow pieces, hints and manual shuffle.
No timer, no lives, no move limit. Best score and current board save locally.

Install on Android using Chrome > Add to Home Screen / Install app.
After the first visit all three games work without a connection.
Updates install themselves: the menu and the Sling map reload once when a new
version is ready. Never clear site data to update — that deletes your progress.

Sling plays in portrait and landscape; landscape gives the widest view.
Drag the sky to look around, pinch to zoom, tap the target button to recenter.
Pause (top-left) has restart, map, how-to-play, sound, calm effects and full screen.

Development: npm install, npx playwright install chromium, npm test.
Or set CHROMIUM_PATH to a compatible installed Chromium executable.
npm run solve regenerates winning shot lists after editing sling/levels.js.
See MONSTER_SLING.md for gameplay/architecture and QA.md for verification.

Monster Match details: see MONSTER_MATCH.md. Run npm run test:match for its tests.
