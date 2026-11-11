# Stick metaphor Short: style guide

A silent motivational Short of six to eight separate visual metaphors. White round-head stick figures on pure black, one to three grey props per beat, one yellow accent on the part that carries the point. All drawn in code on one 2D canvas.

## Look

- Stage: 1000 x 1000 logical units, scaled to the frame. Ground at y 700-800 (vertical sets: y 855).
- Figure: head r 24, torso 78, arms 44 + 42, legs 62 + 62. Line weight 11 (vertical hero 8, `sc` 1.85-1.95, about 1300 px tall).
- Props: line 8, dark fill, grey outline.
- Beats of 3-5 s (sample 4 s), each a different layout: split, three-column row, stacked lanes, tall stack, wall with a door, chain.
- Per beat: 1-3 grey props, one focal point.
- Beat 1 is up at t = 0 with its labels. The last beat replays beat 1's scene under a reversal question and ends exactly on frame one, so the Short loops.
- Vertical sample: 34 s, seven beats, two pictures per beat (weak way 0-2 s, strong way 2-4 s).
- Never: outfits, brands, voiceover, sentences, gradients, 3D, a second figure colour.

## Palette

`PAL` in `engine/runtime.js`.

- Background `#000000`. Figure and labels `#F4F4F0`.
- Prop outline `#9A9A9A`, mid grey `#5C5C5C`, dark grey `#2E2E2E`, fill `#121212`.
- Accent `#FFD21F`, fill `#2B2300`: the point only, one thing per beat.
- Red may replace yellow for a whole film (change `PAL.accent`, `PAL.accentDeep`). Never both in one film.

## Type

- Inter 800 for labels, Inter 500 available (`fonts/`). Upper case, tracking 0.06 em, 2-4 words.
- Landscape sizes: labels 40-44, question 60. Draw text only with `text()`: it enforces 28 px at 1080p, wraps, shrinks and clamps. `ctx.fillText` skips all that.
- Vertical: `labelV(str, t0, t1)`. Caps of at least 64 px with a short yellow bar, above the head (band y 270-500, x 108-918). Call it after the figure.

## Cast and props

The figure is Pip (`characters/stick.js`).

- `figure(x, ground, pose, o)`: the lowest foot lands on `ground` by itself. Options `dir sc sq air ph seed a far lw ex`.
- `ex` adds a face: `calm happy sad shock firm`. None gives the classic single eye.
- `POSES`: `idle reach cheer slump crouch recoil push`. Crouch is short; use it inside a blend.
- `poseKeys(list, L)` tweens `[[t, pose, ease?], ...]`. `mixPose(a, b, u)` blends. `walk(phase, o)` is the walk cycle. `P(p)` completes a partial pose.
- Effects: `sweat(x, y, L)`, `puff(x, y, L, t0)`.
- Props (`sets/props.js`): `ground`, `block`, `wheel`, `door`, `wall`, `domino`, `flag`, `chev`, `ramp`.
- 16:9 moves (`sets/metaphors.js`): `M.split M.grow M.stairs M.drop M.door M.domino`.
- 9:16 sets (`sets/metaphors-v.js`): `MV.wall MV.stairs MV.weight MV.domino MV.gap MV.summit`. Each has `.at(L, side)`, `.draw(L, side)`, optional `.top(L, side, J)` over the hero. Side `'A'` weak way, `'B'` strong way.
- `heroV(at, o)` draws Pip for a vertical set. `o` = `{ sc, pose, ex, dir, ph }`; `pose` is a `POSES` name, `'walk'`, a pose object or `{ from, to, k }`.

## Camera and motion

- Poses are eased (`EZ.o3`, `EZ.back`). `land()` squashes every landing. Idle breathing and head sway run under every pose.
- Props rock a fraction of a degree (`wob`). Ground ticks scroll, `chev` crawls, grey dust drifts.
- Builds are staggered: blocks drop one by one, dominoes cascade.
- Camera: locked or a slow push (1.0 to about 1.05). Each beat opens with a 0.28 s pop (1.05 to 1.0) on a hard cut. No fades between beats.
- Vertical: `frameV(at, o, draw)` measures Pip's pose, centres its box on x 540 and puts his top at y about 525. The camera only zooms: 2.2-2.4 times `WIDE` 0.72 in `film-v.js`.

## Native moves

- `split`: hard vs smart way (wheels = point).
- `grow`: today / a month / a year (last block = point).
- `stairs`: stairs vs slope to a flag.
- `drop`: throw off weights, keep the goal.
- `door`: force the wall, find the door.
- `domino`: one small push (first domino = point).
- Vertical extras: `gap` (fear it, build a bridge) and `summit` (payoff).
- To add one, copy a move.

## Pitfalls

- A prop that never moves is a dead hold. Give it `wob`, a scroll or a build.
- Keep content between logical x 85 and 915; 9:16 crops the rest on a push.
- Loop: the last beat calls `M.split(L - d, ...)` so the scene ends in the state of t = 0. Its camera ends at zoom 1.0. Beats 1 and 7 use `pop: false`.
- `data-duration` = sum of the `beat()` lengths = the `mountFilm()` argument.
- Hero too small: `sc` at least 1.85 at zoom 2.2.
- Wide poses cut by the edge: draw through `frameV()`. A pose box wider than 950 px still clips, so the push bends the elbows.
- Keep the point of the metaphor within about 250 logical px of Pip.
- Same picture three seconds running: one beat = `keys(TT - L, 2.0, [A, B])`. (`keys()` is from `engine/safe.js`; pose keyframes are `poseKeys()`.)
- Vertical end card: `endCard(DUR - 2, DUR, ['Made by Claude Code', 'No video model'])`.

## Files

- 16:9: copy `templates/index.html` and `templates/film.js` to the kit root (28 s sample).
- 9:16: copy `templates/vertical.html` as `index.html` and `templates/film-v.js` as `film.js` (34 s sample, `vbeat()`). HyperFrames allows one root html only.
- Edit `film.js`; new moves go in `sets/metaphors.js` or `sets/metaphors-v.js`.
- `bash tools/render.sh` runs `tools/vcheck.sh` and `tools/layout-check.mjs`. 16:9 has no dead-hold script: run `ffmpeg -hide_banner -i out.mp4 -vf freezedetect=n=-60dB:d=0.4 -f null - 2>&1 | grep -a freeze_` and fix every hit with a bounce, walk, scroll, build or slower push.
- Sound is optional, no voice. Music: ffmpeg `sine` pad at 110, 165, 220 Hz with `tremolo`, `lowpass=f=700`, about -20 LUFS. SFX: a `sine=f=70` thud on landings, a high-passed `anoisesrc` tick on dominoes.
- Lessons: `LESSONS.md`.
