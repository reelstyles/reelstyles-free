# Pop comic panels: style guide

## Essence
The frame is a printed comic page: flat colour in four process inks on aged newsprint, thick black outlines, black gutters. The camera never leaves the page; it pushes into one panel until it fills the screen, then moves on to the next. Limited animation (poses on twos) lives inside each panel, loud lettering pops in on the beat.

## What it is not
Not a motion-graphics "comic filter" over video, not smooth gradients, not 3D, not anime. No photos. Every colour is a real ink or an overprint of two inks. Nothing glows (a glow is a halftone ring).

## Materials (what the engine does for you, `engine/comic.js`)
- **Four inks, multiplied onto paper**: cyan `#00ADEF`, magenta `#EC0A8C`, yellow `#FFE600`, black `#15110E`; paper `#EDE0BE`. Yellow + magenta = red, cyan + magenta = blue/purple, cyan + yellow = green.
- **Ben-Day dots**: any colour layer with tone < 1 prints as a dot screen (pitch 9 px, screen angles c 15°, m 75°, y 0°, k 45°). Tone 1 = solid.
- **Misregistration**: each ink is shifted 4-5 px (and wobbles 1 px, 12 times a second), so coloured edges peek out from under the black line.
- **Ink boil**: each group of shapes gets a new 1-2 px wobble 8 times a second. Outlines scale with the art (so tiny art keeps a thin line).
- **Paper**: speckle/fibre grain that changes 8 times a second, aged-edge vignette.
- Shapes knock out what is under them (painter's order), so draw back to front.

## Palette recipes (`L` in comic.js)
night, navy, deep (backgrounds); blue, cyan, red, yellow, orange, purple, pink, skin, steel (subjects); black, grey, white (= bare paper). Mix your own as `[['c',1],['m',0.4]]`. Keep one dominant ink pair per panel; the hero is always blue/red/yellow.

## Type
Hand-lettered all-caps comic lettering: **Bangers** (SIL OFL, shipped in `fonts/`). Captions: yellow boxes with a thick ink border, 30-44 px. Balloons: paper white, ellipse + tail, 34-44 px. Sound effects: star-burst with red lettering, black outline and a black extrusion, 50-150 px. **Minimum 28 px at 1080p everywhere**; `fitText()` wraps and shrinks to a box but never below 28, `balloon()`/`caption()` size themselves around the text and are clamped into the part of the panel that is on screen (`K.safe`), so text is never clipped by a panel edge.

## Motion grammar
- Poses and boil on twos (12 fps); camera, dots, whoosh lines every frame.
- Pops: `spring()` overshoot (balloons 0.5 s, bursts 0.45 s). Captions slide open from their left edge.
- Impact: 3-frame blank "impact frame", burst pops, camera shake on twos (`SHAKES`), sparks.
- Idle in every held shot: camera drift/push, character breathing, eye scan, antenna blink, window flicker, star twinkle, rotating sunburst, moving glint.
- Panels pop in staggered at the start; the page turn is a 0.4 s slide with a cast shadow.

## Camera and shot grammar
World = the 1920 x 1080 page. `PANELS` lists the quads; `SHOTS` gives for each panel the time the camera lands (`a`) and leaves (`d`). Landing = the panel covers the screen (cover zoom, starts at 0.93 so the border and gutter are visible, pushes to 1.03 during the hold). Moves between panels take about 0.45 s (ease in/out, slight roll, whoosh streaks). Things that break the border (claw, burst) are drawn in `overlay()` after all panels. One focal point per shot, at most 3 study elements (e.g. robot + balloon + sfx).

## Sound palette
Silent is valid. If you add sound: a paper rustle on the page turn, a short thump + noise burst on each burst, a pop on each balloon (see `RENDER.md`).

## Native moves menu
Push into a panel · border-break burst · impact frame · speed-line radial and parallel · balloon pop · caption slide · sunburst backdrop · eye close-up with glint · page turn to a splash/end card · tumbling exit with streaks.

## Variation space
Change the story panels and layout (any quads), the cast (draw new characters with `shape()`), the ink pair per panel, dot pitch `DOT`, misregistration `REG`, paper colour `PAPER`, balloon kinds (`shout: true`), burst words.

## Kit details that are easy to miss
- Every shot needs motion for its whole length; if you add a static prop, give it boil (put it in a `grp()`), breathing, or a drift. Run the freeze check in `RENDER.md` and fix every hit.
- `lt` (time since the camera landed) gates events; before landing `lt < 0`, so page-view panels show their resting art without balloons. Keep the 0 to 1.5 s page view readable: the caption in panel A uses film time on purpose.
- Do not put text outside `K.safe`; do not make a panel's text smaller than 28 px to make it fit, shorten the words.
- Stroke widths scale with art; very small art (< 0.3) needs a simpler drawing.
- Frame must stay a pure function of `t`: use `hash()`, never `Math.random`/`Date`.
- The panel `view` = [centre x, centre y, width, height of the part that must be on screen].

## Vertical pitfalls (9:16 Shorts, machine-checked, 2026-11-09)
The 16:9 film is a page of panels the camera pushes into; on a phone that crops the hero to a sliver of a tall frame. The vertical template (`templates/vertical.html` + `templates/film-v.js`) is a different film shape: **every 2 s a new full-frame panel** (a hard cut with a small slam), the scene drawn in screen units on a set that bleeds past the edges. `tools/vcheck.sh out.mp4` checks the rest with exact times; fix every line it prints.
- **Hero size (owner 11-02: wide, never a crop):** ground y 1560-1640, hero `s` 2.3-3.0, zoom 1.0-1.26 = the whole hero at 33-48% of the frame with the set around him. `hero()` calls `track('hero')` + `track('face')` through `kTrack()` (the shape queue's matrix x the camera); call `kTrack()` in any character or prop you draw (`'key'` for the main object of a shot without the hero, like the whole robot).
- **Labels:** `vlabel()` in screen space after the scene (`kBegin(0, 0, t)` on an identity transform), y 400 = the label band 270-500, x 108-918, lettering >= 64 px (`MIN_TEXT` is 64 in vertical), complete from the first frame. Kinds: yellow caption, balloon with a tail, shout. Keep the hero's head top under y 520.
- **Bursts are art, not labels:** keep sound words off faces and out of the label band; give a 6-letter word r >= 190.
- **Edges:** the robot at s 1.35 is 540 px wide; keep its box 65 px inside the frame after the camera zoom, or pass `track: false` when it is a looming extra cut by the edge on purpose. A leaning hero (`kTr(x, y, rot)`) swings his head sideways: start him further in.
- **Same picture three seconds running:** two panels in a row on the same set must differ in side, scale and pose, or switch the set (the `setPop()` ray panel is the cheap contrast cut).
- **Weak hook:** frame 0 is mid-stomp (a raised leg, a burst popping, a camera shake), with the fact caption on it, never a title.
- **Dots and lines for a phone:** `DOT` is 12 in vertical (9 in 16:9), outlines scale with the art (`s` 2.5 = about 12 px lines); poses: idle, walk, run, reach, punch, cheer, slump, think, shake; faces: smirk, happy, shock, ouch, think.
- Kit lessons from real builds: `LESSONS.md` (newest last).
