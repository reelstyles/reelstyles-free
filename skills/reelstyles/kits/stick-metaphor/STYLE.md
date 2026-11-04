# Stick metaphor Short: style guide

A vertical-first, silent motivational Short built from six to eight separate visual metaphors of about 4 s each. White round-head stick figures on pure black, one to three grey props per beat, and a single yellow accent used only for the part that carries the point (the wheels, the goal, the door, the flag, the first domino). Drawn in code on one `<canvas>` (2D), rendered by HyperFrames. Everything here (figure, props, palette, type) is our own; nothing comes from any real channel.

Read this file, then `RENDER.md`, `RUBRIC.md`, then the header comments of `engine/runtime.js`, `characters/stick.js`, `sets/props.js`, `sets/metaphors.js`. `templates/film.js` is a working 28 s Short: copy and edit it.

## Essence
One idea per beat, shown as a picture, never explained in sentences. The viewer reads a two-word label and the motion does the rest. Six metaphors in a row, each with its own layout and camera feel, then a reversal question over a hold that plays straight back into frame one (the loop).

## What it is not
Not one metaphor stretched over 30 s. Not a slideshow of cards. No faces, outfits, brands, voiceover or on-screen sentences. No second accent colour, no gradients, no 3D.

## Materials and palette (`PAL`)
| Role | Hex |
|---|---|
| Background | `#000000` (pure black) |
| Figure, labels | `#F4F4F0` |
| Prop outline / mid grey / dark grey | `#9A9A9A` / `#5C5C5C` / `#2E2E2E` |
| Prop fill | `#121212` |
| Accent (the point only) | `#FFD21F`, fill `#2B2300` |
Red can replace yellow for a whole film (change `PAL.accent`/`accentDeep`), never both in one film.

## Type
Inter 800 for labels, Inter 500 available (OFL, shipped). Upper case, tracking 0.06 em, 2-4 words. Sizes: labels 40-44, question 60 (logical units). `text()` is the only way to draw text: it enforces **>= 28 px at 1080p**, wraps to the box, shrinks to fit and clamps inside the safe x range, so nothing is ever clipped.

## Motion grammar
- Figures use eased keyframe poses (`poseKeys()`), snappy `EZ.o3` / `EZ.back`, and squash on every landing (`land()`). They never freeze: idle breathing and head sway run on top of every pose.
- Props rock a fraction of a degree (`wob`), the ground ticks scroll, the divider dashes crawl, grey dust drifts across the frame, the beat dots pulse. A hold that has nothing else still has the camera push.
- Builds are staggered (blocks drop one after another, dominoes cascade, words leave the stack one by one).
- Camera: locked or a slow push (1.0 to ~1.05). A beat starts with a 0.28 s pop (1.05 to 1.0) on a hard cut. No fades between beats.

## Shot grammar
Each beat is a different layout: left/right split, a three-column row, two stacked lanes, one tall stack, a wall with a door, a left-to-right chain. 1-3 grey props, one focal point, at most 3 study elements. Beat 1 is up at t = 0 with its labels (cold open). The last beat replays beat 1's scene under the question and ends exactly on frame one, so the Short loops.

## Sound palette
No voice. Soft music bed plus tiny SFX on landings, throws and the domino chain (procedural recipe in `RENDER.md`). A silent render is valid.

## Native moves (`sets/metaphors.js`)
`split` hard vs smart (wheels = point) · `grow` today / a month / a year (last block = point) · `stairs` stairs vs slope (flag) · `drop` throw off weights, keep the goal · `door` force the wall, find the door · `domino` one small push (first domino = point).
Ideas to add by copying a move: bridge vs jump, seed vs shortcut, ladder against the right wall, two doors, tug of war with a rope, crowd vs one.

## Variation space
Accent yellow or red · label words · beat order (keep split first, question last) · 6-8 beats (4-5 s each, update `data-duration` and `mountFilm`) · camera per beat · figure scale `sc` · a second figure colour is NOT allowed.

## Pitfalls
- Text drawn with `ctx.fillText` directly bypasses the 28 px / fit-to-box guards. Always `text()`.
- A prop that never moves is a dead hold: give it `wob`, a scroll or a build.
- Accent on more than one thing per beat kills the point.
- Keep content between logical x 85 and 915 (9:16 crops the rest on push).

## Kit details that are easy to miss
- 16:9 uses `templates/index.html` + `templates/film.js`; 9:16 uses `templates/vertical.html` + `templates/film-v.js` (copied to `film.js`). HyperFrames allows only one root html: copy exactly one to the kit root as `index.html`.
- `data-duration` in the html = sum of `beat()` lengths = `mountFilm()` argument.
- The loop: the final beat calls `M.split(L - d, ...)` (negative L) so the scene continues and ends at the same state as t = 0; its camera must end at zoom 1.0 and `pop: false` on beats 1 and 7.
- Run the freeze check (`RENDER.md` step 4) after every render and fix every hit.
- Figures plant their lowest foot on `ground` automatically; do not compute hip heights by hand.

## Vertical 9:16 (Shorts, Reels, TikTok)
`templates/vertical.html` + `templates/film-v.js` (copy film-v.js to film.js; the 16:9 sample keeps `templates/film.js`). The sample is the VS proverb Short (34 s, "Small steps beat one giant leap"): one big Pip, six metaphor sets, a new picture every 2 s.

**The kit pieces for vertical**
- `characters/stick.js`: `POSES` (`idle reach cheer slump crouch recoil push`), `figure(..., { ex })` adds a face to the round head (`calm happy sad shock firm`; no `ex` = the classic single eye), `lw` sets the line weight, and the figure calls `track('hero')` / `track('face')` (engine/safe.js) unless `extra`. Pose keyframes are `poseKeys(list, L)` (renamed: `keys()` belongs to engine/safe.js).
- `sets/metaphors-v.js`: `MV.wall stairs weight domino gap summit`, each with `.at(L, side)` (where Pip stands for side 'A' weak / 'B' strong), `.draw(L, side)` and an optional `.top()` drawn over him. `frameV(at, o, draw)` AUTO-FRAMES: it measures Pip's pose first (an invisible pass), then shifts the stage so his pose box is centred on x 540 with his top at y ~525; the camera only zooms (2.2-2.4). Pip at `sc` 1.95 is ~1300 px tall.
- `labelV(text, t0, t1)` (engine/runtime.js): Inter 800 caps >= 64 px with a short yellow bar, above his head (label band y 270-500, x 108-918), complete from its first frame, reported to the layout check.
- In vertical with engine/safe.js loaded the beat pips are off (they sat in the bottom UI band).

## Vertical pitfalls (machine-checked, 2026-10-25)
The old vertical film was the 16:9 film width-fitted: a 300 px figure and 11 px lines on a black phone screen. The kit now prevents it; `bash tools/vcheck.sh out.mp4` finds the rest with exact times.
- **Hero too small:** keep `sc` >= 1.85 at zoom 2.2 (>= 1150 px). Crouch is short: use it only inside a blend.
- **Wide poses cut by the edge:** draw through `frameV()`; a pose box wider than ~950 px (push with straight arms) still clips, so the push pose bends the elbows.
- **Props off-frame:** sets are drawn relative to where Pip stands; keep the point of the metaphor within ~250 logical px of him.
- **Same picture three seconds running:** one beat = `keys(TT - L, 2.0, [A, B])`, each picture its own zoom, pose and label.
- **End card:** `endCard(DUR - 2, DUR, ['Made by Claude Code', 'No video model'])` over the payoff picture.
- Kit lessons from real builds: `LESSONS.md` (newest last).
