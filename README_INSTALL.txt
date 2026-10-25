MONSTER ISLAND v18.2 - MONSTER MERGE + MONSTER MATCH

Play: https://azlanyusuff3.github.io/tropic-merge/

The home screen offers two relaxing games.
Monster Merge: original drop/merge game, preserved without gameplay changes.
Monster Match: Classic Endless 8x8 puzzle with distinct Tidalon (water) and
Frostbop (ice) sprites, cascades, special powers, hints and shuffle.

Monster Sling is HIDDEN, not deleted. All Sling files, levels and saved progress
remain available in the repository. It is removed from the default offline cache
to reduce initial download size. It can still be opened via /sling.html when
online, but it is not advertised or supported as an offline game.

Android: Chrome > Add to Home Screen / Install app.
After the first online visit, Merge and Match are available offline.
Never clear site data when updating: this would erase locally saved progress.

Development: npm install; npx playwright install chromium; npm test.
Match-only: npm run test:match. Sling maintenance checks remain in npm test.
