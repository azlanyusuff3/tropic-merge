# Monster Merge artwork

Created for this implementation with the built-in image generation tool using the user's three supplied visual references. Every monster was generated independently with real alpha transparency; none is a crop of the progression sheet. Final gameplay files are optimized 512 × 512 WebP sprites. Their anatomical body centers are normalized to the center of the texture, and each `artScale` maps the painted body back to the unchanged physics radius. Leaves, horns, crystals and wings are decorative.

## Reference roles

- A: tropical beach/island background, wooden logo and toolbar, cream score cards, glass container.
- B: the identities and progression order of all eleven monsters.
- C: bomb target/explosion, shake feedback, merge sparkles/score text, red warning line.

## Generation prompts

Common sprite instructions: Single production transparent game sprite matching the corresponding character in the supplied Monster Progression Ideas reference; polished hand-painted cartoon mobile game art, crisp colored outlines and soft glossy dimensional shading. Large near-circular main body, compact decorations, front view, centered square image with clear padding. One character, no text, labels, UI, detached particles or ground shadow. Genuine alpha transparency.

1. Slimelet: glossy bright lime translucent jelly dome, tiny puddle feet, two shiny black eyes, happy open mouth and pink tongue.
2. Bubblo: glossy translucent cyan bubble sphere, liquid swirls inside the lower body, shiny black oval eyes, joyful mouth, attached bubble feet.
3. Puffling: round fluffy pink fur puff, pointed magenta ears, cheerful closed crescent eyes, open mouth, small silhouette tufts.
4. Sproutiball: golden yellow plant monster, orange spots, three green leaves on top, small pointed yellow nubs, dark eyes and cheerful mouth.
5. Rockro: red-orange rocky body, charcoal angular rocks around edge, determined eyebrows, dark eyes, two white fangs, friendly grumpy expression.
6. Frostbop: white snowy fluffy body, cyan ice armor at bottom, faceted crystal crown and side crystals, closed smiling eyes and pink mouth.
7. Shadebub: purple shadow body, dark curled horns, compact bat wings, violet flame above head, scalloped fur, mischievous purple eyes, fang smile and violet wisps.
8. Groveling: forest spirit, lime face and belly, layered deep green leaves, brown branching antlers, tiny white flowers, peaceful closed eyes, wavy smile and bark base.
9. Tidalon: blue ocean whale, white belly, navy crown and sides, curled cyan waves below, attached water spout, shiny oval eyes, delighted pink mouth with fangs.
10. Lumiorb: ivory celestial body, gold halo, feathered wings, gold filigree and stars, large gold star with blue gem on belly, cloud puffs, joyful closed eyes and pink mouth.
11. Infernodon: legendary round lava dragon, charcoal-plum cracked armor with orange fissures, golden crystal crown and purple gemstone, dark bat wings with fiery membranes, yellow eyes and jagged mouth.

Background prompt: Recreate only the bright tropical fantasy beach/island setting from A: azure sky, soft white clouds, turquoise ocean, distant rocky green islands, palms framing the upper corners, sand and a warm wooden boardwalk across the bottom. Quiet light-turquoise center for the gameplay overlay. Colorful soft cartoon painting with depth. No characters, containers, words or UI. Portrait composition.

PWA icons use the new Slimelet sprite over an opaque turquoise background; the maskable version uses a smaller central composition. UI, glass, aiming guide, effects and toolbar are live DOM/Canvas/vector graphics, not baked into screenshots.

The reference's dimensional painted logo is approximated with responsive text and CSS wood styling. Monster silhouettes and decorative details are practical recreations, not pixel-identical copies.
