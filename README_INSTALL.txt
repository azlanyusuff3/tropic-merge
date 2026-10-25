MONSTER MERGE — Offline PWA

Play: https://azlanyusuff3.github.io/tropic-merge/

Drag left or right, then release to drop. Two identical monsters merge into
one monster of the next level. Reach the legendary Infernodon (level 11).
Bomb: choose the button, then touch and release on one monster to remove it.
Shake: gives the pile a physical nudge; has a 1.2 second cooldown.
Restart: confirms before clearing the current board. Best score is preserved.
Sound: toggles synthesized audio; no remote audio downloads.

Install from Safari's Share > Add to Home Screen on iPhone/iPad, or your
browser's Install/Add to Home Screen option on Android and desktop.
Open online once and let the artwork load before going offline. If updating
an already installed Ball Merge, close and reopen after the update downloads.
The original tropicBest localStorage key is retained.

DEVELOPMENT
Serve this directory over HTTP, e.g. python3 -m http.server 8000.
No build, CDN, framework or runtime dependency is required.
index.html: interface, original custom circle physics, input, cached sprite
rendering, procedural sound, game states and visual effects.
assets/monsters/: 11 individually generated transparent WebP game sprites.
assets/tropical.webp: generated tropical background (not a screenshot UI).
icons/: Monster Merge PWA icons.
sw.js: versioned offline cache, scoped to this game.

ART DIRECTION
A: tropical scene, wooden interface and glass container.
B: Slimelet, Bubblo, Puffling, Sproutiball, Rockro, Frostbop, Shadebub,
   Groveling, Tidalon, Lumiorb and Infernodon, in that order.
C: bomb selection/explosion, physical shake, merge sparkles and danger line.
Artwork is a practical recreation, not pixel-identical to the references.
Sprites are generated individually with alpha, normalized and optimized;
references are never used as gameplay screenshots or directly cropped sprites.
