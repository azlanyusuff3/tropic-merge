MONSTER ISLAND v18.7 - MONSTER MERGE + MONSTER MATCH ELEMENTAL FX

Play: https://azlanyusuff3.github.io/tropic-merge/

Two relaxing games on the home screen:
- Monster Merge: original game remains unchanged.
- Monster Match: Endless 8x8 Match-3 with visual elemental attacks on EVERY
  regular match, with stronger effects on Match 4 and Match 5.
  Slimelet: green Slime Splash
  Tidalon: blue Water Splash
  Puffling: pink Puff Burst
  Sproutiball: green Leaf Storm
  Rockro: Rock Smash shards and amber dust
  Frostbop: Ice Shatter crystals and frost
  Match 4 creates its existing line/blast power; Match 5 evolves into a rare
  monster. The evolved monster's five unique attack powers and Mega Blast 5x5
  are unchanged. Cascade matches trigger more elemental effects.
  Effects are only visual and do NOT clear extra tiles or alter scoring.
  Power previews, hints, shuffle, saved board and high scores remain.

Monster Sling is still HIDDEN, not deleted. Files and progress are preserved;
the hidden game is not part of the normal offline precache.

Install: Android Chrome > Add to Home Screen / Install app.
After the first visit, Merge and Match can be played offline.
NEVER clear site/app data to update, as this erases locally saved progress.

Development: npm install; npx playwright install chromium; npm test.
Monster Match: npm run test:match.

MATCH 5 EVOLUTION FIX (v18.6):
- All five connected matching monsters evolve, including T, L and + shapes;
  no more confusing star/bomb in place of the expected evolved character.
- A matching move creates the special at a genuinely matched tile. Cascade
  specials are anchored within their own match, not the previous swipe.
- Evolved monster artwork is unobstructed: the decorative star badge is gone.
- Legacy saved bomb/rainbow stars are upgraded to the matching evolved monster
  when the saved game is loaded, without resetting score or best score.
- Cascades are automatic follow-up matches triggered by falling monsters;
  feedback is now anchored on the actual matched area.

Run: npm run test:match (includes tests/match5-evolution.mjs).

VISIBLE ELEMENTAL ATTACKS & EVOLUTION RANKS (v18.7):
- Match 3: elemental attack stays visible approximately 1.18 seconds, with a
  glowing line over matched monsters and a legible attack title.
- Match 4: enhanced elemental flash approximately 1.28 seconds.
- Match 5: evolution sequence approximately 1.42 seconds.
- Match 6: Enhanced Evolution approximately 1.51 seconds; stronger power.
- Match 7+: Super Evolution approximately 1.63 seconds; biggest unique power.
- Long cascades show slightly faster effects to keep gameplay responsive.
- Existing evolved attacks are shown for longer too (about 1.05 seconds).
- Five unique evolved abilities now scale with the evolution rank.
- Progress and scores are preserved. Older evolved monsters are normal rank 1.
- Reduced-motion accessibility setting is respected.

Run: npm run test:match (includes tests/match-ranks.mjs).
