# Monster Match — Visible Elemental FX + Enhanced/Super Evolution v18.7

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

## Longer attacks and stronger Match 6/7 evolution (v18.7)

Earlier effects lasted only about 0.5 seconds and often faded during tile
clearing. Now the clearing phase waits for the real attack animation. Actual
matched tiles glow, an elemental streak connects the matched row/column, and a
larger text label remains readable through the attack.

- Match 3: about 1.18 seconds visible elemental casting.
- Match 4: about 1.28 seconds, then a standard line power.
- Match 5: about 1.42 seconds, then normal Evolved rank 1.
- Match 6: about 1.51 seconds, then Enhanced Evolved rank 2.
- Match 7+: about 1.63 seconds, then Super Evolved rank 3.
- Long cascades use a shorter 0.82-second effect to preserve responsiveness.
- Evolved power blasts display for roughly 1.05 seconds, Mega Blast for 1.18.
- Respect operating-system Reduced Motion settings (no particle animation).

The board remains the same 8x8 Classic Endless mode. There are still six
ordinary matching monsters and five evolved characters, with no new buttons
or separate game modes. Enhanced/Super use the same swipe/tap power activation.

| Monster | Normal (5) | Enhanced (6) | Super (7+) |
|---|---|---|---|
| Bubblo | 2 rows | 3 rows | 4 rows |
| Shadebub | 3x3 | 5x5 | 7x7 |
| Groveling | X diagonals | X plus 3x3 | X plus 5x5 |
| Lumiorb | Clear 1 normal type | Clear 2 normal types | Clear 3 normal types |
| Infernodon | 1 row + column | 2 rows + columns | 3 rows + columns |

Match 6/7+ award one-time enhanced-evolution creation bonus. Older saved
evolved tiles lacking `rank` are treated as normal rank 1. Valid ranks are
1, 2, or 3; existing `monsterMatchSaveV1` and `monsterMatchBestV1` keys are
preserved. Monster Merge and hidden Monster Sling remain unchanged.

Regression: `tests/match-ranks.mjs` validates 5/6/7 combinations, the five
powers' stronger footprints, exact-preview equivalence, and older saves.
The browser FX tests measure visible animation duration and attack-title
opacity; mobile-size tests cover 320, 390, 430 and 768 px widths. Physical
Android PWA testing is still recommended.

## Visual-only attack FX (v18.7.1)
Floating elemental titles and evolution/ability name callouts are no longer rendered during gameplay. The existing visual-only particles, glows, beams, power highlights and long animation timings remain unchanged. Score popups, chain multipliers and generic instructions remain to support play. The How to Play reference still names the abilities. Existing save keys and all gameplay logic remain unchanged.
