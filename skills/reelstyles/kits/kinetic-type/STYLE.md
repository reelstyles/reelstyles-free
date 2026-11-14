# Kinetic type

Words are the actors. Every beat is one huge word or a short stack that enters with attitude, lands and keeps moving. In 16:9 the words STAND in a lit typographic set: a floor, a sky or back wall, one light source, props built from type. No people, photos, icons, 3D extrusions or handwriting.

## Look

- **Start every 16:9 shot from a scene recipe** (`sets/recipes.js`); the full lit set exists at frame 0:
  - `setStreet(t0, t1, o)`: sky, light, a skyline of type towers (letters of `o.far` as windows), haze, street floor.
  - `setRoom(t0, t1, o)`: back wall with dot grid and a ghost poster word (`o.far[0]`), window or screen light, floor.
  - `setStage(t0, t1, o)`: pleated backdrop, spotlight cone from above, footlights.
  - `o`: `{mood, light: {kind, x, y}, far, props, subject: (t, S) => ..., near, air, cam, caption: [text, t0]}`. `S.FY` = the subject floor line (y 842), `S.base(z)` = floor y at depth z.
- **Grade per mood** (`engine/look.js`, `GRADES`): `night` · `dawn` · `day` · `dusk` · `neon` · `storm` · `hearth` · `gold` · `cold`. `gradeTrack([[t, mood, blend]...])` turns the tint across the film: cold first, `gold` at the payoff.
- **One light per scene**: `light.kind` `sun` · `moon` · `lamp` · `neon` · `screen` · `window`, drawn with bloom by `lightDraw()` (`hang: true` = ceiling lamp with cord), pooled on the floor and wall. Dark places stay dark, lit only by it.
- **Depth**: far layer (sky/wall, parallax 0.15), skyline (0.35), subject (1), near layer (`near: 'GO'`: two giant blurred letters in the bottom corners, 1.5). `layerIn(cam, p, fn)` for your own layers.
- **Air**: `air` `dust` · `rain` · `snow` · `embers` · `confetti` · `haze`. Grain, vignette and the grade come free.

## Palette

Only `PAL`: ink `#0C0B16`, ink2 `#171428`, cream `#F6F1E7` (default text), violet `#8B5CFF`, pink `#FF4FA3`, mint `#2EE6C5`, blue `#4C7DFF`, coral `#FF6B4A`. Amber `#FFB534` is the accent: eyebrows, signs, the logo dot. Set colours come from `GRADES`.

The subject word is the brightest, most saturated thing in the frame: cream, amber, pink or mint against the grade. Contrast 4.5:1 or more.

## Type

- Display: Archivo Black, `cond` 0.82-0.9 for stacks, full width for titles. Small text: Inter 800 caps, tracked.
- A subject word is 300-520 px (one line) or two lines 220 + 300 px: 30-55% of the frame height.
- Captions (`o.caption`, `small()`): 44 px or more, top band, 4 words max.
- Never draw text with raw `ctx.fillText` in a film.

## Cast and props

The cast are words. `litWord(str, cx, base, size, t, o)` stands a word on the floor (feet on `base`): a rim on the light side, hard shadow, contact shadow and a cast shadow away from the light. Options are those of `word()` plus `pose` (`walk` · `reach` · `cheer` · `slump`, from `characters/cast.js` `POSES`), `cast` (0 for an upper stacked line), `rim`.

Props are type-made set dressing, `props: [[kind, x, z, arg, col]]`, z 0 (back) to 1 (front):
- `block` (one big letter or digit), `sign` (text plate on a post), `board` (glowing amber display), `plinth` (lit box with a word), `lamp` (post lamp).
- 3 props per shot, none behind the subject's letters, none within 65 px of an edge. Story-specific things are said in words (`sign`, `board`), not drawn.

Tools also usable alone: `word()`, `echo()`, `stack()`, `small()`, `brackets()`, `wipeTo()`, `wordBox()` (width for layouts). 9:16 hero: `Hero(lines, t, o)`; its label: `label(str, {t0})`.

## Camera and motion

- `cam: camMove(kind, {t0, d, amt, x, y})`: `push` · `pull` · `truck` · `crane` · `drift`. Neighbouring shots use different moves.
- Default framing is wide: the floor visible under the word, nothing cut by an edge.
- Entrances per letter, staggered 25-70 ms: `drop` (weight), `rise` (build), `slam` (loud), `spin` (logo), `pop`, `fade`. A landed word never freezes (idle bob, drift, its pose).
- Easing: `EZ.o5` entrances, `spring` weight, `EZ.io` moves. Impact: `shake(t, t0, amp)`.
- Hard cuts on the beat between sets, a new picture every 2 s.

## Native moves

- A word drops into the set and its shadow lands with it.
- `walk` word striding across the floor (move `cx` over the shot).
- A word splitting into halves that slide (doors, break-ups): place halves with `wordBox().w`, light through the gap with `lightCone()`.
- Countdown: a number re-slamming each beat.
- Payoff: the grade turns warm and the word cheers.
- Poster stack, colour-field ticker and slot swap (9:16 template) still belong to the style.

## Pitfalls

- First entrance `t0` 0.2-0.35 s before the shot start: frame 0 is mid-landing, never an empty set.
- Props with z above 0.7 or x within 200 px of an edge get cut; check every still.
- A ghost `far` word on a wall is long: keep it to 6 letters.
- A word wider than `maxW` shrinks: split it into a stack.
- `filter: blur` is slow: only the near layer and cast shadows use it.
- Deterministic: `mulberry32` only, never `Math.random` or `Date`. Prefix your own helpers; never redefine kit globals (`LIGHT`, `GRADES`, `word`).

## Files

- 16:9: copy `templates/index.html` to the kit root as `index.html` and `templates/film-look.js` (sets, start here) or `templates/film.js` (the plain stage sample) as `film.js`. `DUR` = `data-duration`; end with `mountFilm(DUR)`.
- Load order: `engine/runtime.js` → `engine/kinetic.js` → `engine/look.js` → `characters/cast.js` → `sets/recipes.js` → `film.js`.
- 9:16: `cp templates/vertical.html index.html && cp templates/film-v.js film.js`. It loads `engine/safe.js` (layout guard) and the `Hero` block; render checks run `tools/vcheck.sh`.
- Stills: `npx -y hyperframes@0.8.96 snapshot . --at 1,3,5,7,9 --no-end -o snapshots`. Render: `bash tools/render.sh out.mp4` in the foreground (lint, layout check, render, checks). Then `node tools/dead-holds.mjs out.mp4` must print `OK`.
- Sound (optional, ffmpeg only): slam = 60 Hz sine 0.25 s; wipe = pink noise 0.4 s highpassed; logo dot = 1760 Hz 0.3 s. One `<audio>` clip in `#root`.
- Kit lessons from real builds: `LESSONS.md`.
