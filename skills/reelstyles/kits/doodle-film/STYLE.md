# Doodle film

One pen and markers on cream paper, lit and graded like a film: a round-headed kid, a cat, a full set in 3 depth layers, one light, a grade per mood, a moving camera.

## Look

- Pen: blue-black ink, 4-7 px at 1080p, drawn twice (thick pass + fainter thin one), line boil at 8 fps. Marker: `fillLoose` = paper underlay, colour multiplied, shifted 5-8 px off the outline, a lighter hatch.
- Film layer (`engine/look.js`), never optional: every shot calls a scene recipe (it calls `look()` for you) or `look({ grade, light, beams })` itself. The grade washes the frame, the far side falls off from the ONE light, the light blooms; the paper grain sits on top.
- Grades (`GRADES`): `day`, `dawn`, `cosy` (lamp-lit room), `rain`, `dusk`, `night`, `golden` (payoff). Turn them across the film: cold or grey first, `golden` or `cosy` at the payoff. Every still stays bright and readable (mean luma 0.3-0.7): `night` is deep blue with lit windows, never black.
- Depth: `layer(f, fn)`: far 0.3-0.6 (sky, hills, back wall), mid 1 (hero, floor, props), near 1.3-1.5 (foreground at the lower corners). It moves against the shot's first camera, so every camera move shows parallax.
- Rim: `halo(x, y, r, a)` behind the hero in the light's colour, drawn before the figure.
- Air: `air(kind)`: `motes`, `rain`, `snow`, `leaves`, `fireflies`. Recipes add one.
- Never: clean vector edges, gradients on characters, blur, 3D, an empty paper frame.

## Palette

Only `PAL`: paper `#F4EEDF`, ink `#232734`, pencil `#5E6272`, coral `#F0645A` (hero cloth), mustard `#F4B63F` (light, lamp, spark), teal `#2EA5A0` (leaves, roofs), sky `#8FCBEA`, lilac `#A99BD8`, mint `#9ADBB2`, blush `#F7C3B5` (skin), night `#2C3150`, glow `#FFE08A`. Your own water, sky and windows take `gradeOf().sky`.

## Type

Caveat bold (`fonts/`), only through `say(str, opts)`: a loose paper plate tilted 1-3 degrees. 16:9: captions 80-96 px at `y: 110` (top centre, above every head), at most 4 words. Night: `plate: PAL.night, color: PAL.glow`. 9:16: `say()` places the plate above the hero's head by itself, 100-130 px.

## Cast and props

- `pip({ x, s, face, ph, armL, armR, look, mouth, brow, hop, lean, hold, ground })`: the kid. Hero at `s: 1.2` (about 410 px). `ph: TT * 9` walks. `mouth`: `'smile'`, `'grin'`, `'o'`, `'flat'`, `'sad'`. `brow` 0-1 startle. `hold(handX, handY)` draws the carried prop. Pass `ground: S.floor` from the recipe so the feet stand on its floor.
- `cast(name, { tint, hat, hatC, stache, legC, scarf })`: one costume per person, defined once. Hats: `cap`, `bowler`, `helmet`.
- `dot({ x, s, face, ph, sit, look, mouth, hero, ground })`: the cat, `s: 1.0` beside a 1.2 Pip, 250+ px from his x.
- Scene recipes (`sets/scenes.js`), one call = a full set for any place: `setRoom(o)` (back wall, window, shelf, picture, floor lamp = light, plant, rug, boards), `setStreet(o)` (sky, far skyline, houses, lamp post = light, fence, bush, pavement), `setOutdoor(o)` (sky with sun or moon, far hills, trees, fence, rock, meadow). `o = { grade, hero, props: [[name, x], ...], light, beams, air, back, fg }`; each returns `{ floor, light }`. New place = new `props` and `grade`, not a new set.
- Props for your own sets: `windowP`, `shelf`, `lampFloor`, `plant`, `table`, `chair`, `rug`, `picture`, `house`, `lampPost`, `fence`, `bush`, `rock`, `hill`, plus `ground`, `tuft`, `cloud`, `tree`, `flower`, `sun`, `moon`.
- Your story's own prop: draw it with `ink`, `shape`, `fillLoose` in a small prefixed function (white paper boat, bold outline, one colour stripe), at least 12% of the frame height. Doodles (`heart`, `swirl`, `note`, `sparkle`, `arrow`, `spark`) decorate around the hero, never on him.

## Camera and motion

- `shot(t0, t1, draw, title, cam)`, shots tile `0..DUR`, one shot per 2 s. Every shot uses a move: `camPush(x, y, z0, z1, t0, t1, dx, dy)`, `camPan(x0, x1, y, z, t0, t1)`, `camCrane(x, y0, y1, z0, z1, t0, t1)`, `camDrift(x, y, z, t0, t1)`. Neighbours differ in framing.
- 16:9 zoom with Pip at `s: 1.2`: wide 1.05-1.15 (hero about 42%), medium-wide 1.25-1.35 (about 50%), close 1.5 only as a short beat. Floor at y 860: camera y 600-690.
- 9:16 zoom: wide 2.45-2.6, medium 2.55-2.75, close 2.95-3.05. `camY(groundWorldY, zoom, feetScreenY)` in `templates/film-v.js`.
- Timing: `EZ.io`, `EZ.back` (pops), `spring(t, k, z)`, `seg`, `lerp`. Idle life always runs.
- Cuts are hard cuts. The scribble wipe only on a chapter change, under 0.3 s.

## Native moves

A line drawing itself on. A sheet folding into a thing (`fold` 0-1). Startle: hop, wide eyes, `'o'` mouth, a word plate pops. Sparkles popping around a finished thing. Rain on the window, then the sun breaking out with a rainbow drawn on stripe by stripe. Ripples on a puddle. The cat reacting a beat late. Grade turning from `rain` to `golden`.

## Pitfalls

- Frame 0 is a full, lit set with the hero already in it: never build the set on with `p`, never open on paper.
- Light: one source per shot, inside or just outside the frame (lamp, lamp post, sun, window). Two glows read as murky.
- Doodles, plates and foreground never touch the hero's face or body: recipes keep the foreground 380 px off `hero`; pass it.
- Hero 40-55% of the frame height, feet on the floor, nothing cut by an edge. The key object at least 12% of the frame.
- 9:16: re-zoom and re-stage (`sceneryV` in `templates/film-v.js`); the cat 250 world px from Pip.
- `endCard(DUR - 2, DUR)` only when asked.

## Files

- 16:9: copy `templates/index.html` and `templates/film.js` to the kit root. 9:16: `templates/vertical.html` as `index.html`, `templates/film-v.js` as `film.js`. Edit `film.js`; keep `data-duration` (root and `<audio>`) equal to `DUR`.
- Render with `bash tools/render.sh`: lint, layout check, render, dead-hold check. It writes `out.mp4` only when all pass.
- Score: `audio/score.wav` (procedural); re-time in `tools/score.sh`, then `bash tools/score.sh`. Delete the `<audio>` tag for a silent film.
- Lessons from real builds: `LESSONS.md`.
