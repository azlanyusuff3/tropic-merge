# Monster Match — Elemental FX + Match-5 Clarity v18.6

This release improves **every ordinary match** without adding gameplay complexity.
The 8x8 Classic Endless board, six normal monster types, five evolved characters,
score, saved progress and power-combo mechanics remain unchanged.

## Match effects

| Regular tile | Every Match 3+ casts |
|---|---|
| Slimelet | Slime Splash — glossy green blobs |
| Tidalon | Water Splash — ocean-blue rings and bubbles |
| Puffling | Puff Burst — light pink puffs |
| Sproutiball | Leaf Storm — stylized green leaf particles |
| Rockro | Rock Smash — earthy angular shards and gold dust |
| Frostbop | Ice Shatter — cyan crystal shards and frost |

- Match 3: light elemental burst just before the normal tiles disappear.
- Match 4: stronger element burst, then the existing row/column power tile.
- Match 5+: larger burst and the existing EVOLVE effect. The evolved monster
  stays on the board; users can activate its unique power by swiping.
- Cascades play their own element effects, with a restrained combo cue.
- T/L bombs, elemental evolved powers, 5x5 Mega Blast and saved legacy rainbow
  powers work the same as in v18.4.

This is **visual feedback only**: no extra tile clears, no effect on score or
balance. Compact CSS-only particles with a maximum of four simultaneous groups
keep phone rendering light; reduced-motion settings eliminate particles. Audio
uses the existing optional sound toggle.

## Implementation

- `match/engine.mjs` now includes visual-only `stages[].matches` metadata
  (group color, matched cell positions, visual tier 3/4/5). Actual game logic
  is unchanged.
- `match/effects.mjs` creates short-lived elemental FX overlay nodes and tile
  charging highlights. `match/effects.css` draws the particles, rings and
  match labels using CSS. No new image files, dependencies or canvas engine.
- `match/app.js` displays elemental casting before clearing, while preserving
  existing special power FX and evolution animations.
- `match.html` explains the behavior; service worker precaches the new files.
- Local save keys `monsterMatchSaveV1` and `monsterMatchBestV1` unchanged.
- `merge.html`, source monster assets and archived Sling game untouched.

## Testing

`npm run test:match` runs earlier engine/evolved-power checks plus
`tests/match-elements.mjs` (matched-cell/tier metadata) and
`tests/match-fx.cjs` (browser effects/reduced motion).
Local QA completed: 149 match-metadata cases; 450 equivalent moves compared
against the previous engine (identical score, board, clears, specials and combos);
34x elemental and power checks; mobile browser at 320x568, 390x844,
430x932 and 768x1024, including all six elements and enhanced tier effects.
Physical Android/PWA visual performance still needs on-device confirmation.

## Match-5 evolution and confusing star fix (v18.6)

A five-piece match formed by two intersecting lines (T, L, or +) used to
spawn a generic star/bomb because the engine checked for a straight run of
five before checking the size of the connected group. Now ALL connected
groups of five or more matching pieces spawn the appropriate evolved sprite.

A special produced by cascading pieces is anchored within its own matching
group, instead of reusing unrelated earlier swipe coordinates. Popup feedback
is also placed on the actual matched group; secondary matches are identified
as automatic chain reactions.

The small star badge previously drawn over evolved artwork is removed, and
the evolved sprite is shown larger. Older saved `bomb`/`rainbow` star pieces
are promoted to the corresponding evolved character on load without erasing
board progress, score or best score. Underlying legacy special abilities
remain supported by the engine if explicitly present in a test/setup board.

The save format and storage keys remain identical. The 8×8 board, six base
match kinds, five unique evolved abilities, 3/4/5 elemental FX, and Mega Blast
remain. Monster Merge and hidden Monster Sling game files remain untouched.

Regression: `tests/match5-evolution.mjs` verifies straight, L and + five-piece
matches, all six base kinds, correct placement and evolution identity, power
activation, 1,464 cases total and 448 automatic cascade stages. Additional
mobile Chromium tests validated the UI at 320, 390, 430 and 768 px wide and
checked that saved star pieces upgrade with scores preserved.
