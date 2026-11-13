# Doodle film

A scored mini story drawn with one pen and markers on cream paper: a beginning, a surprise, a small change, an exit. A round-headed kid, a cat, a few props.

## Look

- Pen: blue-black ink, 4-7 px at 1080p, drawn twice (a thick pass, a fainter thinner one). Smooth noise nudges every line and re-seeds on 3 drawings at 8 fps (line boil). `amp` 2-3 px calm, 3-5 scribble.
- Marker: `fillLoose` = paper underlay, colour multiplied and shifted 5-8 px off the outline, a lighter diagonal hatch. Colour misses the line a little.
- Never: clean vector edges, gradients on characters, blurred shadows, 3D, lines under 3 px.
- Pip is about 300-360 px tall at `s: 1`. Ground is near y 830: feet at `groundY(x) + 10`, tufts and flowers below.

## Palette

Only `PAL`: paper `#F4EEDF`, ink `#232734`, pencil `#5E6272`, coral `#F0645A` (hero cloth), mustard `#F4B63F` (scarf, spark, sun), teal `#2EA5A0` (trees), sky `#8FCBEA`, lilac `#A99BD8` (dusk), mint `#9ADBB2` (grass), blush `#F7C3B5` (skin), night `#2C3150`, glow `#FFE08A`.

Mustard and glow only on the magic object and what it lights (`glow()` is the one soft thing). The sky goes sky, lilac, night. Night is a solid wash: `wash(x, y, w, h, c, seed, a, false)`.

## Type

Caveat (`fonts/`), only through `say(str, opts)`. Text sits on a loose paper plate tilted 1-3 degrees; on night use `plate: PAL.night, color: PAL.glow`. Titles 84-120 px, captions 60-90 px. In 9:16 `say()` places the plate above the hero's head by itself: use 100-130 px and `maxW` 560-640.

## Cast and props

- `pip({ x, s, face, ph, armL, armR, look, mouth, brow, hop, lean, hold })`: the kid. `ph: TT * 9` walks. `mouth`: `'smile'`, `'grin'`, `'o'`, `'flat'`, `'sad'`. `brow` 0-1 is startle. `hold(handX, handY)` draws the carried prop.
- `cast(name, { tint, hat, hatC, stache, legC, scarf })` returns a figure function. Define each person once, call it in every shot. Hats: `cap`, `bowler`, `helmet`.
- `dot({ x, s, face, ph, sit, look, mouth, hero })`: the cat.
- Passers-by: `pip({ extra: true })`. Leave `y` out so feet snap to the ground.
- Your own character or prop: draw with `ink`, `shape`, `fillLoose` inside `figure('hero' | 'prop' | 'key', () => {...}, name)`, with `track('face', ...)` on a hero's head. Wrap bleeding effects in `unmeasured(() => ...)`.
- Sets: `wash`, `ground`, `tuft`, `cloud`, `tree`, `flower`, `sun`, `moon`, `twinkle`, `rays`, `motes`.
- Doodles: `heart`, `swirl`, `note`, `sparkle`, `arrow`. Magic object: `spark(x, y, r, rot, { glowA, tail })`.
- Marks: `ink`, `fillLoose`, `shape`, `scribble`, `glow`; points from `ellP`, `rectP`, `blobP`, `splineP`, `starP`. Every mark takes `seed` and `p` (0-1 draws on).

## Camera and motion

- `shot(t0, t1, draw, title, cam)`; `cam(t)` returns `[x, y, zoom, tilt]`. Shots tile `0..DUR`.
- 16:9 zoom: wide 1.0-1.06, medium 1.2-1.4, close 1.5-1.85.
- 9:16 zoom: wide 2.45-2.6, medium 2.55-2.75 with tilt -0.04 to 0.02 rad, close 2.95-3.05 (3.2 cuts the scarf). Feet near screen y 1640. `camY(groundWorldY, zoom, feetScreenY)` in `templates/film-v.js` gives the camera y.
- Builds stagger: rays 60-100 ms apart, doodles pop with `EZ.back`, landings and startles use `spring(t, k, z)`; `EZ.io`, `EZ.i2`, `seg`, `lerp` time the rest.
- Idle life in every shot: `motes()` over empty sky, cloud drift, grass and tree sway, turning rays, star twinkle.
- Cut: a scribble wipe, 0.22 s each side. 16:9: `w` 260, 14 turns, left to right. 9:16: `w` 150, 9 turns, top to bottom.

## Native moves

A line that draws itself on. A spark falling with a scribbled comet tail. Startle: hop, wide eyes, `'o'` mouth, a word plate pops. Rays staggered out of an object. Doodles orbiting the hero (16:9) or rising in a column out of the spark (9:16). Scribble wipe. Dusk turn where the glow lights the path. The cat reacts a beat late. An arrow that curls and arrives.

## Pitfalls

- A multiply fill with no paper underlay goes muddy over coloured sky. Keep `base: true` except for washes.
- 9:16 with a 16:9 camera gives a tiny hero and a flat green band. Re-zoom and re-stage.
- 9:16 sets: `sceneryV(dusk, p, sunP, trees)` in `templates/film-v.js`. Keep trees off Pip's head. The sun rides the camera at screen x about 680; draw it before clouds and trees or it multiplies dark. Ground under about 28% of the frame.
- 9:16 cat or side prop: offset 250 world px from Pip's x or it hides his body. Give Dot her own shot. Spark, rays and glow stay left of x 940, never across the face.
- 9:16 spark falls the whole frame (`tail` 330); doodles rise a short way out of it. No tall stems or poles.
- Keep wipes under 0.3 s, or a wipe frame on a whole second reads as an empty tile.
- `endCard(DUR - 2, DUR)` dims the payoff shot, which keeps running behind it.
- A new picture every 2 s: `keys(t0, 2.0, [shotA, shotB])`, each shot its own camera.
- A beat's key object goes in `figure('key', ...)`, at least 20% of the frame height: draw thin levers and ropes thick. A big set piece (tank, house, boat) goes in `figure('prop', ...)` and fits whole.

## Files

- 16:9: copy `templates/index.html` and `templates/film.js` to the kit root.
- 9:16: copy `templates/vertical.html` as `index.html` and `templates/film-v.js` as `film.js`.
- Edit `film.js`. Keep `data-duration` (root and `<audio>`) equal to `DUR`.
- Render with `bash tools/render.sh`: lint, render, then `tools/deadhold.sh` (16:9) or `tools/vcheck.sh` (9:16) and `tools/layout-check.mjs`. It writes `out.mp4` only when all pass, else `out.FAILED.mp4` and the fixes. A dead hold is a tile unchanged for 1.2 s: add motes, a cloud, a camera push or a staggered build.
- Score: `audio/score.wav` is procedural (pentatonic tune, whoosh, pop, chime, swell, footsteps). Re-time it in `tools/score.sh` (`add <freq> <start> <dur> <vol>`, `noise <start> <dur> <vol> <lowpass> <highpass>`), then `bash tools/score.sh` (needs ffmpeg). Delete the `<audio>` tag for a silent film.
- Lessons from real builds: `LESSONS.md`.
