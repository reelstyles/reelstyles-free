# Countdown guessing quiz: style guide

A bright, game-show quiz film. One drawn item per round (a fruit, an animal shadow, a waving flag) sits on a candy-gradient stage; a ring timer drains in three ticks; on zero the shadow floods with colour, the name springs in with confetti and a score bar ticks up. Four difficulty bands (easy, medium, hard, impossible) each get a full-screen title card and their own stage colours. No characters, no voiceover, no real logos, products or people. All code, drawings, palette and type are our own.

Read this, then `RENDER.md`, `RUBRIC.md`, and the header comments of `engine/runtime.js`, `sets/items.js`, `sets/stage.js`. `templates/film.js` is a working 25.6 s film (four bands, one round each); copy and edit it.

## Essence
Pure anticipation: the viewer reads the shape, the ring runs out, the payoff lands. Every round has the same rhythm (spring in, 3 s countdown, colour wipe + name pop + confetti + score tick) so the viewer learns it in one round and plays along.

## What it is not
Not a slideshow of cards, not a photo quiz, not a talking-host format. No logos, brands, product shots, real people or lookalike channel branding. No second display font.

## Materials and palette (`BANDS` in `sets/stage.js`)
| Band | Gradient | Silhouette tone | Accent |
|---|---|---|---|
| easy | `#46E39B` → `#17A6D6` | `#0F5C8A` | `#FFE14D` |
| medium | `#5C9BFF` → `#9457FF` | `#2D1B7A` | `#FFE14D` |
| hard | `#FFA63D` → `#FF3D86` | `#7A1A4A` | `#FFF0A0` |
| impossible | `#C0143F` → `#2A0A55` | `#12041F` | `#FFD84A` |
White text, translucent plum UI (`rgba(20,10,60,.4)`), warning red `#FF5A6E` in the last second.

## Type
Inter 900 (OFL, shipped) made chunky and round by a same-colour round-join stroke (7 % of the size) with a soft plum drop shadow. Upper case, 2-4 words. `text()` is the only way to draw text: min 30 px, wraps, shrinks to fit the box and clamps inside the frame, so nothing is clipped.

## Motion grammar
- Item: springs in from above, then breathes (±2.5 %), sways and bobs for the whole round; flags wave continuously.
- Ring: drains linearly, pulses and pops the number on each second, shakes and reddens in the last second; ring becomes a check and shrinks away after zero.
- Reveal (zero): white flash, circular colour wipe from the item centre with a bright rim, item squash-bounce, name spring (overshoot + tilt settle), 36 confetti pieces, score pill fills with a spring and a shine.
- Always moving: rotating gradient, drifting diagonal stripes, rising bokeh bubbles, breathing spotlight, bobbing HUD pills, shine sweep on the score bar, slow camera push per beat.
- Title card: expanding rings, band word springs in then keeps growing, stars pop one by one and twinkle.

## Camera and shots
Hard cuts between title card and round, a slow 1.0 → 1.04 push in every beat. Round = 5.1 s (0.6 in, 3.0 ring, 1.5 payoff); title = 1.3 s. Layouts are separate for 16:9 (item left, ring + score right, text under the item) and 9:16 (item top, text, ring, score bar; clear of the top 180 px and bottom 150 px platform UI), selected by canvas size (`LAY`).

## Sound palette
Silent is valid. Recipe in `RENDER.md`: a soft tick per second, a rising whoosh into the reveal, a pop + sparkle on the name, a short riser under title cards.

## Kit details that are easy to miss
- No dead holds: nothing may sit still > 1.2 s; the idle layers above must stay on. Run the freeze check in `RENDER.md`.
- All text >= 28 px at 1080p and never clipped: always `text()`; do not add `fillText` calls. Long answers shrink to fit `maxW`.
- One focal point: the item. The ring is secondary, the score bar tertiary; do not add more study elements.
- Silhouettes must still be guessable: items mark eyes/highlights/seeds with `x:1` so they vanish in the shadow; difficulty comes from the choice of item (flags are two-tone dark, so only the layout shows).
- Keep `data-duration` = sum of beats = `mountFilm(total)`.
- `drawItem` is a pure function of `t` (no random); confetti uses a seeded RNG.

## Native moves menu
Double round (two items before the answer), "which is bigger" splits, a streak counter replacing the score bar, a band-end bonus round with a longer ring, a reversed round (colour first, shape fades to shadow), a fake-out tick (ring stalls at 1).

## Variation space
Band colours, band count, ring length (change `T_RING`), item set (add entries to `ITEMS`: shapes or flag cells), prompts, score total, accent colour, layout (`LAY`).

## Adding an item
Append to `ITEMS` in `sets/items.js`: `{ name, kind:'shapes', shapes:[{ c, ops:[...] , x?:1 }] }` in a ±200 px box. Drawn parts first, details (`x:1`) last. Preview it with a one-round film.
