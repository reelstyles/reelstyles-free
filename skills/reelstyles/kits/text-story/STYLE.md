# Chat text story: style guide

Shared rules: `../FILM.md`, `../REVIEW.md`. Renderer: `hyperframes@0.8.96`. A frame is a pure function of film time `t` (`hash()`, `mulberry32`, never `Math.random`/`Date`).

## Look
A story told only through a conversation. The phone is a **lit object in a real place** (a desk at night, a kitchen, a bedside table): it stands on a surface, its screen shows the live chat and throws light on the table. Beside it the same conversation **floats in big bubbles** on a frosted glass slab, so the viewer reads every word.
- **Frame 0 is full**: the place, the lit phone and the history bubbles are all on screen at t = 0.
- **Grade per mood** (`LOOK.GRADES`, per shot `grade`, turned inside a shot with `to` + `turn: [s0, s1]`): `night` (blue room, warm lamp), `dread` (cold teal), `dawn`, `day`, `warm` (golden payoff), `neon`. Stills sit at mean luma 0.35-0.45; the card about 0.65.
- **Light**: one key light per place (desk lamp, pendant, bedside lamp) with a glow, a light cone, light pools on wall and surface, a rim on every prop toward it, contact shadows away from it; the phone screen adds its own spill.
- **Depth**: far = the city, dawn sky or trees in the window (parallax 0.3); wall, curtains, picture, bed (0.82); surface, props and phone (1.0); one big blurred foreground object in a lower corner (1.55); bokeh drifts in the glass slab.
- **Air and texture**: dust in the lamp light, mug steam, wall stripes or tiles, wood grain, film grain, vignette.

## Palette
night `#0B0D18` · screen `#121629` · their bubble `#323C66` · our bubble `#FF7A59` · saffron `#FFC857` (avatar, read tick, card) · mint `#7BE0C3` (online) · text `#EEF2FF` · ink `#160F14`. The set takes its colours from the grade (`wall`, `surface`, `out`, `shade`, `light`, `rim`); a prop colour goes through `LOOK.tone()` so it sits in the grade.

## Type
Inter. Floating column: 500 at 46 px (50 px vertical), names 800 44 px, times 30 px white. Phone texture: 30 px. Card: 900, fit to 80% of the width, `sub` 800 60 px. `F()` in `engine/chat.js` never goes under 28 px. Optional shot caption: `caption: { text, at: 'tl'|'tr'|'bl'|'br' }`, 52 px on a plate.

## Cast and props
No people, no faces: the two voices are the bubbles and a round initial. Places in `sets/scenes.js`, each a full set (surface, back wall, window with a far view, 3+ props, a near layer) with a phone slot `S.slot` and its dressing on the side away from the chat column:
- `SCENES.desk(o)`: lamp, books, mug with steam, plant, picture; window to the city.
- `SCENES.bedside(o)`: bed behind (`lump: true` = something under the duvet), lamp, clock (`time: '23:48'`), glass.
- `SCENES.kitchen(o)`: tiled wall, pendant lamp, kettle, fruit bowl, mug; window at dawn.
Options: `flip: true` mirrors the place (use with `float: 'l'`), `view: 'city'|'dawn'|'trees'`, `win: [x, y, w, h]`, `curtain`. Props in `sets/props.js`: `phone`, `lamp`, `mug`, `books`, `plant`, `glass`, `clock`, `kettle`, `bowl`, `bed`, `frame`. Story pictures: `photo: (c, w, h, t) => {...}` draws your own in a message.

## Camera and motion
- `STORY.shots = [{ t0, t1, scene, set, grade, to, cam: [[t, [x, y, zoom]], ...], float, phoneX }]`; a new shot is a cut, the same `scene` + `set` is the same place again. World: the surface top is y = 200, `[0, 0, 1]` shows x -960..960.
- **Default framing**: medium-wide, the phone (430 px tall) 35-45% of the frame height at zoom 1.0-1.1, screen x about 520, the surface edge near y 900: `cam = [S.slot + 400, -160, 1.0]`. One close beat (zoom 1.4-1.55) per film. Nothing cut by an edge.
- Every shot moves: a push (+0.05-0.1 zoom) and a 20 px drift. A new shot every 2-2.5 s; neighbouring shots change place, side (`flip` + `float: 'l'`) or zoom.
- Messages spring up with scale 0.9 → 1; typing dots for them (and for us, when `typed: true`); the column scrolls on a damped spring; read ticks pop saffron; reactions pop and bob; photos develop in 0.7 s.
- Card: hard cut, lines slam in 0.2 s apart, the last on a coral bar, slow zoom, sliding stripes.

## Native moves
Typing dots that stop and restart · a long pause then a one-word reply · a reaction as the answer · a photo as the reveal · time stamps jumping (23:49 → 3:12) · "typing…" with nobody typing · the grade turning cold on the bad news (`to: 'dread'`) · the next shot in the room the chat talks about.

## Pitfalls
- Messages in time order; `at` = the bubble lands, typing starts `typing` s earlier. Keep 1.3 s between messages (2 s for a long one) and never 1.2 s with nothing new: add dots or a reaction.
- Dark or murky stills scored 2-6: keep `night`/`dread` as given, do not darken walls.
- A prop under the chat column is hidden by the slab: put story objects on the phone's side (`flip` the place instead).
- The phone is cached per scene + set: `phoneX` of the first shot of a place wins.
- Never copy a real messenger's colours, chrome or emoji. Card `sub` at most 30 characters; root `data-duration` = `STORY.dur`; the card runs to `dur`.

## Files
- `templates/index.html` (16:9) or `templates/vertical.html` (9:16, copy as `index.html`) + `templates/film.js` (the starter, "Juno and the studio door") to the folder root next to `engine/`, `sets/`, `fonts/`, `tools/`. Load order: gsap, `engine/runtime.js`, `engine/look.js`, `sets/props.js`, `sets/scenes.js`, `engine/chat.js`, `film.js`.
- `look-test/h/`: proof film "The cat" (desk, kitchen, desk close, bedside, card).
- Stills: `npx -y hyperframes@0.8.96 snapshot . --at 1,3,5,7,9 --no-end -o snapshots`.
- **Render**: `bash tools/render.sh out.mp4` in the foreground: lint, `tools/layout-check.mjs` (phone inside and big enough, chat column and captions inside, never over the phone), render, `tools/holdcheck.mjs`, `clip-measure --gate`.
- Sound (optional): `node sfx.mjs` writes `audio/sfx.wav`; add it as an `<audio class="clip">` in `#root`.
