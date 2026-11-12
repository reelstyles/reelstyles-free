# Stick metaphor Short: style guide

White round-head stick figures in a dark, lit world: grey-outlined props, one yellow accent on the point, one light that rims the figures, a grade per mood. A scene recipe gives any story its place. All code on one 2D canvas.

## Look

- Identity (never change): white round-head figures with thick round lines, grey-outlined props with dark fill, ONE accent colour, a dark stage. No outfits, brands, textures on the figures, 3D or a second figure colour.
- Every shot is a full, lit picture from its first frame: back layer, floor, 3+ props, one light, moving air. No black void.
- Stage: 1000 x 1000 logical units scaled to the frame (16:9 shows about x -410..1410, y -15..1015 at zoom 1). Floor at y 780-810.
- Default framing: wide or medium-wide, the figure whole at 30-55% of the frame height (`heroSc(0.42)`), nothing cut by an edge.
- Shots of 2 s. The payoff is last, in the warmest grade.

## Palette

`PAL` in `engine/runtime.js`, grades in `engine/look.js` (`GRADES`).

- Figures and type `#F4F4F0`. Props: outline `#9A9A9A`, mid `#5C5C5C`, fill = the grade's back colour darkened.
- Accent `#FFD21F` (deep `#2B2300`): the point only (a lantern, a lamp, a door, the wheels). Red may replace it for a whole film.
- Grades: `night` (blue moonlight), `cold` (teal gloom), `dusk` (red-orange), `ember` (warm interior), `dawn` (violet to amber), `gold` (payoff).

## Type

- Inter 800 caps, tracking 0.06 em, at most 4 words.
- 16:9: `caption(str, t0, t1)`: 60-76 px, white, dark shadow, yellow bar, top centre (drops to the bottom when a face is under it). Film time (`TT`); call it after the scene.
- 9:16: `labelV(str, t0, t1)` (`caption` calls it): caps of at least 64 px above the head, band y 270-500.
- Text inside a set or move: `text()` only (it enforces 28 px at 1080p and clamps).

## Cast and props

Pip, `characters/stick.js`.

- `figure(x, ground, pose, o)`: the lowest foot lands on `ground`. Options `dir sc sq air ph seed a far lw ex extra rim shadow`. Every figure gets a cast shadow and a rim from the scene light.
- `ex`: `calm happy sad shock firm`. `POSES`: `idle reach cheer slump crouch recoil push`. `poseKeys(list, L)`, `mixPose(a, b, u)`, `walk(phase, o)`, `P(p)`. Effects `sweat`, `puff`.
- Scene recipes (`sets/scenes.js`), each a whole place in three depth layers with one light:
  - `SCENE.land(L, o, subject)`: sky with sun/moon (`o.sun`), peaks, hills with trees, path, tree, rocks, fences, grass in front.
  - `SCENE.street(L, o, subject)`: skyline with windows (`o.lit` 0..1), houses, pavement, kerb, lamps (`o.lamps: [{ x, on }]`, `on` may be a function of L), bench, bin, hedge in front.
  - `SCENE.room(L, o, subject)`: panelled wall, window (`o.outside` draws the view), pendant lamp (`o.lamp` 0..1; off = the window lights the room), shelf, picture, table, chair, plant, sofa in front.
  - `subject(gy)` draws your figures on the subject plane. Common `o`: `gy air seed props front`.
- Set props in the kit line: `tree rock fence lampPost bench bin building windowFrame table chair shelf plant pendant`, plus `block wheel door wall domino flag ramp ground` (`sets/props.js`).
- Light props: `lantern(x, y, on)` and `holdLight(x, gy, pose, o, on)` (Pip carries a lantern; its light rims him).
- Missing a thing? Build it from these shapes, prove it on a still (FILM.md).

## Camera and motion

- `beat(dur, draw, { grade, cam, stage, pop })`. `stage: false` for a scene recipe; without it the beat sits on the default lit stage (`stageBack()`: graded sky, two ridges, top spotlight, floor pool, fog).
- Camera moves (`CAMS`): `push(z0, z1, x, y, dx)`, `pull(...)`, `pan(x0, x1, z, y)`, `crane(y0, y1, z, x)`, `drift(z, x, y)`.  Each also slides sideways so the layers part.
- Depth: `layer(f, fn)` draws at depth f: 0.08 sky, 0.3 far, 0.55-0.6 back, 1 subject, 1.35 foreground.
- Light: `lightAt(x, y, o)` registers the scene light (first one = the rim light; `key: true` puts it first); its glow blooms over the frame in `post()`. `beam(x, y, gy, w)` cone, `pool(x, gy, w)` floor pool, `orb(x, y, r)` sun or moon.
- Air: `air(kind)`: `dust fog embers rain snow`. Texture: grain, grade tint and vignette in `post()`, every frame.
- Eased poses (`EZ.o3`, `EZ.back`), `land()` squash, idle breathing, prop `wob`. A cut pops 1.05 to 1.0 (`pop: false` on shot one).

## Native moves

- Scenes: a figure doing the story's action in `SCENE.land`, `SCENE.street` or `SCENE.room`, lit by the story's light. The accent is the thing the story is about.
- Metaphor moves on the lit stage (16:9 `M.split M.grow M.stairs M.drop M.door M.domino`; 9:16 `MV.wall MV.stairs MV.weight MV.domino MV.gap MV.summit` with `heroV`, `frameV`).
- Light spreads: one light, then many (lamps catch in turn with `on: (L) => ...`, windows with `lit`).
- Grade turn: night → cold → dusk → gold.

## Pitfalls

- Frame 0 is a full lit picture: never fade a set in, start captions at t0 0 complete.
- A figure in a chair: ground = the floor, not the seat (the pose's shins reach the floor).
- Figures 140+ px apart.
- One accent kind per shot. Many lit lamps glow in the grade's light colour; only the story's light is yellow.
- Over 2 strong lights blow out: extra lights `r` 160-220.
- `data-duration` = sum of the beats = `mountFilm()` argument.
- 9:16: `sc` at least 1.85 at zoom 2.2; draw the hero through `frameV()`.
- Loop films: the last beat replays beat 1 and its camera ends where beat 1's starts.

## Files

- 16:9: copy `templates/index.html` and `templates/film.js` to the kit root. 9:16: `templates/vertical.html` as `index.html`, `templates/film-v.js` as `film.js`.
- Load order: `engine/runtime.js`, `engine/look.js`, `engine/safe.js`, `characters/stick.js`, `sets/props.js`, `sets/scenes.js`, `sets/metaphors.js` (+ `sets/metaphors-v.js`), `film.js`.
- `bash tools/render.sh` runs the layout check (edges, framing) before the render and `tools/vcheck.sh` after it on 9:16.
- Sound optional: ffmpeg `sine` pad 110/165/220 Hz, `tremolo`, `lowpass=f=700`, -20 LUFS.
- Lessons: `LESSONS.md`.
