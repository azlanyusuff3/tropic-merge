# Monster Island v15 — verification, 25 October 2026

Baseline: main commit `b3afe4155a2ded41473806f4e789fdebb92d8b34` (Monster Merge v14).

## Preservation

`merge.html` contains the baseline's exact original engine scripts and CSS. The regression runner asserts their SHA-256 fingerprints before testing. Only a return-to-menu anchor was added to the original document. Original sprite/background/icon binaries are unchanged. The new `index.html` is the menu; Care runs in its own document and modules.

Engine SHA-256: `1386508f6affd0af53c2b1bc9b6097037e9d14086b60fd0f364b6036bfe62fc0`.

## Automated coverage

Headless Chromium with Playwright, real touch/pointer events, the actual Canvas game engine and production service worker. Model tests use simulated timestamps. Mini-game tests inject state inspection and accelerated simulation ticks into the HTTP response only; production modules ship without test/debug hooks. Scoring is earned through the actual pointer handlers and physics, rather than directly assigning scores.

- Model: starter; read-only species unlocking; independent adoption; food preferences; action cooldowns; XP/bond/energy; bathing; offline sleeping; long absences/backwards clocks; all growth thresholds; purchases/placement; daily and score milestone claim deduplication; all mini-game rewards; achievements; anniversaries; validated save and backup recovery; invalid-value rejection; unchanged legacy keys.
- Original Merge regression: sprites, touch drop, dragging, all ten merges, collision separation, Infernodon explosion/disappearance, scoring/combo, bomb charges, Shake, ten seconds of pile physics, danger/game-over/restart, Collection, achievements, sound toggle, every living-face rig, jelly/body animation, NEXT sizing, multi-touch input regression, offline reload and unrelated-cache preservation.
- Care browser: menu launch, unlocks/adoption/switching, favorite feeding, play, pointer-stroke affection, interactive soap/rinse bath, sleep/wake plus simulated closed-app recovery, all four mini-games with nonzero earned scores/end/reward/records, cancelled-game cleanup, daily/achievement persistence, all eleven sprites/rigs, Adult Infernodon, shop and furniture slots, garden groups and selecting a friend, legacy storage immutability, independent mode navigation and actual Merge save/resume after visiting Care.
- Responsive browser checks: all six Care screens and menu at 320×568, 390×844, 430×932 and 768×1024. Merge also tested at 1440×900. No horizontal overflow, offscreen navigation or overlapping navigation buttons. Smaller phones intentionally scroll vertically to retain readable controls.
- Lifecycle/upgrade: install the actual v14 service worker under `/tropic-merge/`, update to v15, retain all Merge keys, resume the old board, retain an unrelated cache even when it shares a legacy name prefix, remove only this scope’s old cache, verify zero pending RAF callbacks outside active scenes, simulate app backgrounding during a mini-game, and exercise normal Back navigation.
- Offline checks use unmodified production modules, a real installed service worker and disabled browser networking. Menu, Care, mini-game launch and original Merge all work. No JavaScript exceptions, console errors or broken runtime artwork.

## Reproduce

`npm install` then `npx playwright install chromium` and `npm test`. `CHROMIUM_PATH` can select another installed Chromium executable. Output screenshots and JSON summaries go to ignored `test-output/`.

## Limits

No physical Android/iPhone/iPad tests were performed. Add to Home Screen installation UI, hardware-specific audio behavior and actual budget-phone frame rates remain unverified. Growth/elapsed-time scenarios use controlled timestamps rather than waiting multiple days. Mini-game timing is accelerated in automated gameplay checks, and the real offline smoke test uses the unchanged runtime. No cross-device/cloud saves; browser storage must be retained. There is no claim of measured 60fps on physical hardware. Android Back uses normal document/hash history and native dialog dismissal; OS-specific gesture behavior still needs a physical-device check.
