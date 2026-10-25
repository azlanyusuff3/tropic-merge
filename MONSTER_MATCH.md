# Monster Match — Elemental Evolution v18.4

Monster Match remains a lightweight, endless 8×8 match-three game. The Monster Island menu still shows only Monster Merge and Monster Match; Sling remains hidden.

## Gameplay

- Match 3: clear normal tiles and score.
- Match 4: create a row/column blast.
- Match 5+: evolve one tile into a rare monster that stays on the board.
- Tap an evolved monster to briefly **preview its power**, or drag toward a neighbor for an exact directional preview.
- Swap evolved + any neighbor: activate that evolved monster's unique element power instantly.
- Swap two evolved monsters together: a 5×5 **MEGA BLAST**, without doubling the original powers.
- Blasts that hit other evolved monsters chain-trigger their own abilities. No lives, limits, level system, rescues or energy meters.

## Five unique elemental powers

| Match 5 of | Evolved monster | Power |
|---|---|---|
| Slimelet / Sproutiball | Groveling | **Vine Strike**: clear the two intersecting diagonals through the landing tile |
| Tidalon | Bubblo | **Tidal Wave**: clear two horizontal rows |
| Puffling | Shadebub | **Shadow Explosion**: blast 3×3 around the landing tile |
| Frostbop | Lumiorb | **Star Magic**: remove all ordinary monsters of the type swapped with Lumiorb |
| Rockro | Infernodon | **Inferno Blast**: clear one full row and column |

Lumiorb hit by a *chain reaction* targets the most common remaining ordinary monster kind. Powers show brief, distinct CSS elemental animations and highlighted impact cells. The standard board still has just six matching kinds; the other five are evolved specials, bringing all eleven Monster Merge characters into the game.

## Compatibility and testing

- Rules: `match/engine.mjs` exports `ABILITY_NAMES`, `powerCells`, `previewPower`, and `makeMove`. UI is `match/app.js`, `match/style.css`, and `match.html`.
- Previews and actual effect footprints share the same rules. Existing saved rainbow pieces still function; new five-matches create evolved monsters.
- Save keys `monsterMatchSaveV1` and `monsterMatchBestV1` are unchanged, including old valid boards and high scores.
- Monster Merge and Monster Sling engines, sprite files, and saved progress are not changed. Sling remains hidden and un-cached by default.
- Offline service worker cache is versioned for this update.

Run `npm run test:match` for engine and browser regression suites, or `npm test` for all games. Development tests locally covered 343 core + elemental scenarios and the five abilities on a simulated mobile touch browser, alongside 320×568, 390×844, 430×932 and 768×1024 layouts. Real Android installed-PWA QA is still recommended.
