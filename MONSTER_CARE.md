# Monster Island — v15.0

Two independent document-based games share the existing 11 monster sprites. `index.html` is the island menu, `merge.html` contains the original v14 Merge implementation, and `care.html` starts the Care modules. There is no iframe and no framework. Leaving a document stops its engine; the original Merge `pagehide` handler saves the board.

## Play

- A free Baby Slimelet, 120 coins, a bed, a rug and a small pantry welcome new Care players. The first adoption achievement grants another 20 coins.
- Family reads `monsterMergeCodexV1` (zero-based IDs). Discovered species can be adopted free; one individual per species, up to 11 independently saved pets. Switch friends through Family or Garden.
- Feed four foods; favorites improve happiness and bond more. Stroke to cuddle, tap to tickle, drag to guide. Gentle sleepers dislike rough tickles. Rub soap onto your pet until the lather meter fills, then rinse. Play with a ball or an equipped toy. Sleep/Wake works online and offline.
- Needs change with real elapsed time, including after closing the app. At most 12 hours of need decay is applied per return. Needs have recoverable floors; friendship never decays from absence. Backwards clock changes rebase the timestamp. There is no death, daily streak or permanent neglect penalty.
- Baby → Young requires 160 XP, 4 feeds, 3 plays and 25 bond. Adult requires 650 XP, 15 feeds, 10 plays, 65 bond and care on 3 separate calendar days. Growth retains the species, changes size and adds an Adult crown.
- Personality affects movement speed, idle frequency, special animations, fatigue, affection gains, food preferences and bath reactions. Facial animation, eye tracking, jelly, blinks and reactions reuse a separate copy of the existing visual rig. Care never loads Merge physics.

## Activities and rewards

Catch Food (30s): move horizontally to collect fruit and avoid stones. Bubble Pop (25s): tap moving bubbles. Jump Challenge (35s): tap/Space to jump over increasingly fast driftwood; three bumps finish the run. Hide & Seek (45s): watch peeks and find the pet in six possible locations over five rounds. Every game has real scoring, an end condition, records, XP, happiness and 5–35 earned coins. Closing or backgrounding an unfinished game aborts it without rewards.

The shop has four foods and ten props: two toys, two beds, two plants, a lantern, a shell, a stool and a rug. Purchases/equipped items appear in six preset room slots. Owned items can be swapped or removed without repurchasing. Toys improve play rewards; beds improve sleeping recovery. The room and decorations are shared across the family.

Goals contains eight achievements and an optional daily gift (25 coins and two mangoes). Care grants at most one 3-coin reward per minute per pet. Merge best-score milestones (500 / 1,500 / 5,000 / 10,000 / 25,000) grant 25 coins each, once, with claimed IDs saved. Monthly adoption anniversaries grant a small once-per-day visit gift. Garden shows up to four moving/social pets per group and paginates the complete roster.

## Storage and offline

Only `monsterCareSaveV1` and `monsterCareBackupV1` are written by Care. Saves are validated before writing, and the previous valid snapshot is retained for recovery. Storage failure displays a visible warning. Existing Merge keys are only read, never reformatted or overwritten by Care. Clearing browser/site storage still removes local progress; there is no cloud sync or account.

The service worker precaches all 29 runtime resources, including both modes and every sprite. Installation is all-or-nothing and uses reload requests. Old caches are removed only when their names match this project's legacy prefixes **and every cached URL is inside this registration's scope**. Unrelated application caches are retained. Icon files and the original manifest name/start URL remain compatible with existing installs. Updates do not forcibly reload an active Merge board.

Care uses 30fps home drawing, 15fps while sleeping, up to 60fps during active gestures, 20fps garden drawing and a 15-second needs/save tick. Facial masks are prepared once when a species is first needed. Hidden documents stop drawing, abort mini-games and suspend audio. No background service, backend, tracking, ads or real payments.

## Artwork

All 11 WebP sprites and the tropical background are reused unchanged from the repository. `care/room.svg` and the food/furniture/icon drawings in `care/art.js` are original vector artwork created for this project and may be distributed with it. There are no additional third-party artwork dependencies.

v15.1 repaints every prop to match the glossy hand-painted monsters instead of flat clip-art: volume gradients, coloured outlines, specular highlights, soft contact shadows and surface detail (mango blush and leaf veins, glossy berries in a glazed bowl, a fibrous coconut with a striped straw, an iced star biscuit, a translucent soap bar with foam and rainbow bubbles, woven basket bed, terracotta and glazed pots, a glowing paper lantern and more). Each inline icon gets unique gradient ids. The room has window light, a sea view, folded curtains, wooden floor planks and a vignette, with the same geometry as before so saved furniture slots still line up. Bathing leaves foam that clings to the monster and releases floating rainbow bubbles; monsters get a soft contact shadow; mini-games use a painted beach backdrop (rendered once per round), real rocks, driftwood stumps and sparkle bursts.

## Validation

Run `npm install`, `npx playwright install chromium`, then `npm test`. Alternatively set `CHROMIUM_PATH` to a compatible Chromium executable. Tests start their own HTTP servers and generate ignored `test-output/` screenshots/results. See `QA.md` for the tested scope and limitations.
