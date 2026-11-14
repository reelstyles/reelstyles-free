# Whiteboard explainer: style

An explainer drawn live in marker on a dry-erase board: handwriting written stroke by stroke, floating markers, a magnet coin, a felt eraser. No hands, cursors, photos or icon packs. Every shot is a full, lit, coloured place drawn on the board, never lines on empty white.

## Look

- Broad-marker colour fills (`wash()`) are the colour masses under the ink.
- **Grade per mood** (`engine/look.js`): `grade([[t, mood, blend s]...])` with `day` · `warm` · `gold` · `cold` · `tense` · `night`. Turn it across the film (cold or night first, `gold` at the payoff).
- **One light per scene:** `light({x, y, col, r, kind})` (the scene recipes call it). Glow, shade away from it, a rim on Max's lit side.
- **Depth:** `draw` / `write` / `wash` take `{layer: 'far' | 'mid' | 'near'}`. Far moves at 0.55 of the camera, near at 1.45, soft, in front of Max; `anchor(x, y)` = the scene centre (recipes set it).
- **Air:** `air('dust' | 'snow' | 'rain' | 'embers' | 'leaves', {x, y, w, h, n})`, one per scene.
- Always on: grain, vignette, scuffs, handheld drift.
- Strokes ease slow-fast-slow inside the window you give `draw()` / `write()`: labels 0.3-0.8 s, titles 1.2-3 s. A magnet `lift` 1 → 0 drops with a clack.

## Palette

- Ink `#20242b` (things, structure) · `sig` `#177f8c` (process, the strong way) · `hot` `#e0523b` (the one accent, the weak way) · highlighter `#ffd84a`. At most three marker colours, each keeps its meaning all film (`PAL` in `engine/wb.js`).
- Set colours per mood: `SETC` in `sets/sets.js`. Flat, muted fills; saturated colour only on the story object.

## Type

- Board text is the single-line hand (EMS Tech) via `write()`: `y` = baseline, `size` = cap height. Measure with `textWidth(str, size)`.
- `sign(text, x, y, {size, col, plate})`: bold marker letters on a paper plate, for a word that must read at once.
- 16:9: `caption(text, t0, t1)` = a bold 60 px light-on-dark plate, at most 4 words, one per shot. 9:16: `label()` (below).

## Cast and props

- Max (`characters/cast.js`) is a marker-drawn man with ink outlines that boil. `hero(t0, t1, {x, y, s, dir, pose, ex, hold, reveal})`: (x, y) = feet. `s` 1 = 890 px; 0.5-0.6 in 16:9. Poses: `idle`, `walk(u)`, `reach`, `cheer`, `slump`, `point`, `push`, `shrug`, `think`, `umbrella`, `blend(a, b, u0, u1)`. Expressions: `happy`, `sad`, `shock`, `firm`. `hold`: `coin` / `bag` / `umbrella` / `key` / `phone`.
- **Scene recipes** (`sets/sets.js`) draw a whole place before frame 0: wall or sky (far), floor (mid), 3+ props, a near piece, the light, the air.
  - `interior(cx, floor, {mood, light: 'lamp' | 'window', lx, wallProps, props: {L, R}})`
  - `outdoor(cx, ground, {mood, light: 'sun' | 'moon'})`
  - `street(cx, ground, {mood})`
  - Put Max within 250 px of `cx`.
- `prop(name, x, y, u, {mood, layer})` draws one generic piece: table, chair, plant, lamp, shelf, window, picture, door, tree, rock, bench, streetlamp, bin, post, fence, crate, building, hill, curtain, grass. Story objects are yours: draw them with `draw()` + `wash()`, or live with `live()` + `track('key', ...)`, in this line and these colours.
- Shapes: `line`, `curve`, `fn`, `circle`, `box`, `arrow`, `dashed`, `check`, `underline`, `axes`, `bars`. Also `highlight(x, y, w, h, t0, dur)`, `magnet({col, r, label, keys})`, `erase(t0, t1, x, y, w, h)`, `wash(rectW(...) | ellW(...), col, t0, dur, {a, grad, layer})`.

## Camera and motion

- **Default: cuts.** `shot([[t, cx, cy, zoom, roll, whip, zoomEnd, panX, panY]...])` gives one key per picture, a new picture every ≤ 2.2 s, a push (`zoomEnd`) plus a pan (`panX`) so the depth layers slide. Wide or medium-wide: zoom 0.95-1.3 with Max at `s` 0.55 puts him at 35-60% of the height, feet visible. A close-up on the key object (zoom 1.4+) is a short beat without Max.
- Each scene gets its own board region, 5000 px apart; two shots may share one from different framings.
- Free board travel: `cam([[t, cx, cy, zoom, roll]...])` for whips and pull-backs across one big diagram.

## Native moves

A formula written term by term · a magnet as the only mover · the eraser rewinds a result · two pens in a duet · highlighter under the answer, then circle it · the grade warms when the idea clicks · a callout (`dashed()` line) from a small thing in Max's hand to its big drawing.

## Pitfalls

- Frame 0 is a full, lit picture: sets come from the recipes (pre-drawn, no pen). Only the action is written on screen.
- Big story objects stand beside Max as a callout, linked to his hand, never floating alone.
- Keep wall props off a board you draw on (`wallProps: []`). Props and text stay 65 px inside the frame. Only walls, floor, sky and the near layer bleed.
- **9:16** (`templates/film-v.js` is the model, `bash tools/vcheck.sh out.mp4`):
  - Max in every picture, feet on y 1540, `s` 1, zoom 0.98-1.1; each picture in its own spot (`PIC_X` 1700).
  - One `label(text, t0, t1, {col})` per picture, above his head, at most 12 capitals. No `caption()`.
  - Hook: frame 0 mid-action. `endCard(t0, t1, lines)` only when the user asks for one.
- Lessons from real builds: `LESSONS.md`.

## Files

- 16:9: copy `templates/index.html` + `templates/film.js` (a board demo) to the kit root, or `templates/film-look.js` (every look tool) as `film.js`. 9:16: `templates/vertical.html` as `index.html`, `templates/film-v.js` as `film.js`. The load order is `engine/wb.js` → `engine/look.js` → `engine/safe.js` → `characters/cast.js` → `sets/sets.js` → `film.js`.
- Edit `film.js` only, and end it with `mount(DUR)`. `DUR` = `data-duration` in `index.html`.
- Render: `bash tools/render.sh` (lint, layout check, render, checks). Sound: `node tools/foley.mjs film.js audio/foley.wav` builds the marker sounds.
