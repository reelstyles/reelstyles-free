# Pop comic panels

Four process inks on aged newsprint, thick black outlines, black gutters. You draw flat shapes back to front; the engine prints the look. No gradients, 3D, photos or glows (a glow is a halftone ring).

## Look

- A colour layer with tone 1 is solid. Tone below 1 prints as a Ben-Day dot screen.
- Dot pitch `DOT`: 9 px in 16:9, 12 px in 9:16. Screen angles: c 15°, m 75°, y 0°, k 45°.
- Misregistration `REG`: each ink shifts 4-5 px and wobbles 1 px, so colour peeks out from under the black line.
- Ink boil: every `grp(id)` gets a new 1-2 px wobble 8 times a second. Art under scale 0.3 needs a simpler drawing.
- Paper grain (`paperPost`) swaps 8 times a second.
- Panel border 12 px black, gutters 16-28 px, on a 1920 x 1080 page.
- Poses and boil run on twos (`q12`); camera and dots every frame.

## Palette

- Inks: cyan `#00ADEF`, magenta `#EC0A8C`, yellow `#FFE600`, black `#15110E`. Paper `#EDE0BE`. Lettering red `#E8261C`.
- Overprints: y+m = red, c+m = purple, c+y = green.
- Recipes in `L`: night, navy, deep, dusk (backgrounds); blue, cyan, red, yellow, orange, purple, pink, green, skin, skinSh, steel, steelD (subjects); black, grey, white (bare paper).
- Mix as `[['c', 1], ['m', 0.4]]`. One dominant ink pair per panel. No other hex colour.

## Type

- Bangers, all caps, in `fonts/`. Draw it with `txt()` and `fitText()`.
- Captions: yellow box, thick ink border, 30-44 px, slide open from the left in 0.28 s.
- Balloons: white ellipse with tail, 34-44 px, `spring()` pop in 0.5 s.
- Sound effects: star burst, red lettering, black outline and extrusion, 50-150 px, pop in 0.45 s.
- `fitText()` wraps and shrinks to a box, never below `MIN_TEXT` (28 px; 64 px in 9:16).
- `balloon()` and `caption()` clamp themselves into `K.safe`.

## Cast and props

- `hero(o)`: the courier, blue suit, red cape, yellow bolt, domino mask, about 278 units tall, origin at the feet. Options `{x, y, s, flip, t, id, pose, ex, track}`. Poses: idle, walk, run, reach, punch, cheer, slump, think, shake. Faces `ex`: smirk, happy, shock, ouch, think.
- `robot(o)`: the brute, about 600 x 380 units. Adds `mad`, `power` (0 = off, it sags), `stomp` (raised leg), `cable`.
- `robotHead(o)`: the head alone, 300 x 240, scanning red eye. `claw(o)`: an arm reaching in (`curl`).
- 16:9 sets (local units): `nightSky()`, `skyline()`, `sparks()`.
- 9:16 sets (screen units, bleeding past the edges): `setStreet()`, `setRoof()`, `setPlant()`, `setSky()`, `setPop()`, `setDawn()`, `bigSkyline()`.
- Furniture: `balloon()` (`shout`), `caption()`, `burst()`, `speedLines()` (radial), `streaks()` (parallel), `sunburst()`.
- No other people exist. Build new ones with `shape()`, `poly()`, `blob()`, `ell()`, `rect()`, `rrect()` inside `grp()`.

## Camera and motion

- The world is the page. `PANELS` holds the quads; `SHOTS` gives per panel the landing time `a` and leave time `d`. Shots tile the film.
- Landing: the panel covers the screen. Zoom starts at 0.93 of cover (border and gutter show) and pushes to 1.03.
- Moves between panels: 0.45 s, eased, slight roll, whoosh streaks. Page turn: 0.4 s slide with a cast shadow.
- Panel `view` is `[centre x, centre y, width, height]` of the part that must be on screen.
- `lt` is the time since landing (below 0 before, so balloons stay hidden).
- Impact: a 3-frame blank frame, a burst, a shake on twos (`SHAKES`), `sparks()`.
- Idle in every hold: drift, breathing, eye scan, twinkling stars, turning sunburst.
- 9:16 is a different film: a full-frame panel every 2 s, hard cut, small slam. Panel `cam(lt)` returns `[cx, cy, zoom]`.

## Native moves

- Push into a panel until it fills the screen; break the border with a burst or claw in `overlay()`.
- Impact frame, radial and parallel speed lines, sunburst backdrop.
- Eye close-up with a moving glint; page turn to a splash.

## Pitfalls

- Dead holds: `ffmpeg -hide_banner -i out.mp4 -vf freezedetect=n=0.003:d=1.0 -an -f null - 2>&1 | grep freeze_start` must print nothing. Fix hits with drift, breathing, a staggered build, or a `grp()` boil on a static prop.
- 9:16 hero size: ground y 1560-1640, `s` 2.3-3.0, zoom 1.0-1.26 (whole hero at 33-48% of the frame).
- 9:16 tracking: `hero()` tracks itself. Call `kTrack()` in any other character or prop you draw; pass `'key'` for the main object of a shot without the hero.
- 9:16 labels: `vlabel()` in screen space after the scene, with `kBegin(0, 0, t)` on an identity transform. Band y 270-500, x 108-918, lettering at least 64 px. Kinds `cap`, `shout`, or any other for a balloon (with `tail`). Keep the hero's head top under y 520.
- Keep bursts off faces and out of the label band. A 6-letter word needs r at least 190.
- The robot at `s` 1.35 is 540 px wide. Keep it 65 px inside the frame after zoom, or pass `track: false` to loom off the edge. A leaning hero (`kTr(x, y, rot)`) swings his head sideways: start him further in.
- Two 9:16 panels in a row on one set must differ in side, scale and pose, or switch the set (`setPop()` is the cheap cut).
- Past defects: `LESSONS.md`.

## Files

- 16:9: copy `templates/index.html` and `templates/film.js` to the kit root. Edit `film.js`: `PANELS`, `SHOTS`, `overlay()`, the end card. `DUR` must equal `data-duration` in `index.html`.
- 9:16: copy `templates/vertical.html` as `index.html` and `templates/film-v.js` as `film.js`. Same `DUR` rule; 31-38 s for a Short.
- `bash tools/render.sh` renders and checks. `node tools/layout-check.mjs .` prints layout problems per 0.25 s.
- Sound is optional. Foley with ffmpeg only: a thump (70 Hz sine plus pink noise, faded out) per burst, a rustle (white noise, highpass 2000 Hz) on the page turn. Delay each to its time with `adelay`, then add one `<audio class="clip">` inside `#root`.
- Code: `engine/`, `characters/`, `sets/sets.js`.
