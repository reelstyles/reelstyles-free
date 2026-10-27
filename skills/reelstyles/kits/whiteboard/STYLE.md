# Whiteboard explainer: style

An explainer drawn live on one glossy dry-erase board. Handwriting is written stroke by stroke, floating markers (no hands) lead the eye, a magnet coin slides, a felt eraser wipes, and the camera travels across a big board instead of cutting. Suits 45-120 s explainers: money, science, "how does X work", product walk-throughs.

## What it is not
Not a kinetic-type video (text is never faded or popped in as a block, always written in stroke order). Not a blueprint or a paper-craft look. No hands, arms or cursors, ever. No clip-art, no photos, no icons from a pack: every picture is a few honest marker strokes.

## Materials
- **Board**: warm white gradient, world-locked scuffs and haze, faint ghost marks of old lessons (`ghosts()`), a soft diagonal window sheen that drifts slower than the board, a light vignette.
- **Ink**: opaque marker composited with multiply at 94 %, chisel-tip width (thicker on one diagonal), pressure ramp at the start, taper at the end, a pooled dot inside the start of long strokes, low-frequency hand wobble plus fine tremor. A dry-marker speckle is subtracted from the ink in board space and fades out when the camera is wide.
- **Highlighter**: wide translucent band painted under the ink (`highlight()`), tall areas are filled by a zig-zag of swipes.
- **Props**: one marker per colour (white barrel, colour band, cap), a felt eraser, glossy magnets. All have cast shadows that grow when they lift.

## Palette
| Role | Hex | Meaning (hold it the whole film) |
|---|---|---|
| board | `#f7f6f1` / `#ecebe4` | surface |
| ink | `#20242b` | things and structure |
| signal (`sig`) | `#177f8c` | process, measurement, the thing in motion |
| hot | `#e0523b` | the one accent: what matters, one per region |
| highlighter | `#ffd84a` | emphasis under ink |
| ghost | `#8a96a8` / `#9fb2c8` | old lessons, 9-11 % |
Three marker colours at most. Monochrome variant: everything ink, one `hot` element. Alternative sets: navy `#1f2a44` / green `#2e8b57` / red `#c8363a`; edit `PAL` at the top of `engine/wb.js`.

## Type
All board text is the single-line hand (EMS Tech, OFL) via `write()`. Title cap height 150-200 px, labels 40-70 px. Captions are burned subtitles: off-white rounded label, Architects Daughter 44 px, accent dash, at most about 44 characters, kept inside the bottom 12 % (leave it free in every shot). Hold a caption at least max(1.8 s, speech + 0.6 s).

## Motion grammar
- Every stroke follows slow-fast-slow (`hand()`); you give `draw()` / `write()` a time window and the engine solves the speed, so writing always ends on the word.
- Pens hop between strokes (lift grows with distance, shadow slides), park off-frame in gaps over 1.8 s and fly back 0.55 s before the next stroke. Two colours writing at once = two pens at once.
- Magnet: lift 1 → 0 is a drop (shadow shrinks, tiny squash, clack in the foley); sliding lifts a little.
- Eraser: a zig-zag at constant speed, 90 % strength, a ghost always remains.
- Writing speed: label 0.3-0.8 s, title 1.2-3 s. Faster than a hand, never so fast the order is lost.

## Camera / shot grammar
`cam([[t, cx, cy, zoom, roll]...])`: eased between keys, zoom in 1/z so pushes feel like dollies, a hair of roll on whips (0.006-0.012 rad). Shutter blur is automatic when the camera moves more than ~14 px a frame.
| Move | Says | Use for |
|---|---|---|
| Hold | read this now | equation, definition, list |
| Whip to a new region (0.8 s) | a new idea, a "but" | chapter change |
| Slow push into one symbol | this term is the point | a unit, a variable |
| Ride the pen | one thing leads to the next | a process, a path |
| Return to an old region | callback for free | comparison, reuse |
| Pull back to the whole board | the lesson as one picture | the last 2 s |
Regions live far apart on the board (e.g. 2200 px): distance on the board = distance in the argument.

## Sound palette
Every stroke sounds. `tools/foley.mjs` synthesises it from the film's own schedule: felt-on-gloss hiss + body enveloped by the stroke's speed curve, a nib tick, stick-slip grains, a dry-erase squeak on some long strokes (pitch by colour), magnet click + thump, eraser rub, low room tone, pan from the stroke's x. Put music well under (around -22 LUFS), a single ticking clock or fan can own a silence. A silent film is valid.

## Pitfalls
- Title too wide: 8 capitals need size ≤ 175 at 1920. Use `textWidth(str, size)` to check.
- One pen overloaded drifts late: give each drawing its own `t0 + dur` window; use another colour for overlapping jobs.
- Lines far outside the axes: keep curves inside the chart (compute where they leave the frame).
- A label half-cut by a push-in looks sloppy; labels are fully in or fully out of a shot.
- A pooled dot bigger than the stroke leaves halos (it is kept at 0.36 × width; do not enlarge).
- Punctuation: a font period is a 1 px stroke; the engine turns sub-width strokes into dots.
- Eraser paths crossing text you want to keep.

## Native moves (menu)
Write a formula term by term as it is said · the pen leads the camera along a line · a magnet is the only thing that moves (a coin, a truck, a cell) · the eraser rewinds a result · two pens at once for a duet · a ghost of the old lesson becomes relevant · highlighter under the answer, then circle it · the full-board pull-back as the ending · stick figure (`person`), light bulb (`bulb`), speech bubble (`bubble`), bars (`bars`), axes (`axes`), tick (`check`).

## Variation space
Structures: a proof (claim on top, board fills downward, each step boxed) · a debate (two colours, two halves, drawings meet in the middle) · a timeline (one long line ridden left to right) · a before/after split. Openings: a huge `?` shrunk into the first dot · an erased board with a ghost of the wrong answer · a magnet dropping with a clack. Endings: the answer circled twice and the pen parked · the board wiped except one line · a push into the smallest symbol.

## Kit details that are easy to miss
- The film is a pure function of `t`: register things with times, never animate with `Date`/`Math.random`. `mount(DUR)` must be the last line of `film.js`, and `DUR` must equal `data-duration` in `index.html`.
- World = pixels; the default camera centre is (960, 540). Text `y` is the baseline; `size` is the cap height.
- `write()` returns `{x0, x1, y0, y1, t1, cx}`: use it to place underlines and circles.
- The font has no lowercase accents beyond what `fonts/ems-tech.js` lists; unknown characters become `?`. Check with `Object.keys(WB_FONT)`.
- Chrome loads the caption face from `fonts/`: keep the folder next to `index.html`.
- Pen/ink pairing: `col: 'ink' | 'sig' | 'hot'` select the marker; raw hex works for strokes but then there is no dedicated pen cap.
- Strokes outside the view are culled, so a 60-element board costs nothing.
- Snapshots: HyperFrames `snapshot` has no `--workers`; render does.

## Vertical 9:16 (Shorts, Reels, TikTok)
A vertical film is its own composition for 1080x1920, never the 16:9 film shrunk into the middle. Start from `templates/vertical.html` + `templates/film-v.js`; the engine takes its frame size from the canvas attributes, so the same `wb.js` draws both formats.
- **Safe area (same in every kit):** Shorts/Reels/TikTok cover the top 250 px, the bottom 450 px and the right 140 px with UI. All text, captions, numbers and faces stay inside x 90-940, y 250-1470; centred captions at most 800 px wide (x 140-940). Board, ghosts, highlighter and camera motion still fill the full frame edge to edge.
- **Framing (same in every kit, 2026-10-19):** the main subject (the character as seen in the shot: full body, knees-up or close-up; or the one key object) spans at least 60% of the frame height (>= 1150 px, measure it on the stills). Feet and lower body may run under the bottom UI band; only text and faces must stay in the safe area. One character per shot by default; a two-shot or split screen only as a short cut-in (<= 1.5 s). Frame 0 is mid-action: something is already moving in the first frame, never a standing establishing shot. Where a number below gives a smaller subject, move the camera closer.
- **Board as a tall page:** regions are stacked by distance in y, not x (about 1500 px apart); the chapter change is a whip DOWN the board (0.9-1.0 s, roll 0.008). At zoom 1 with the camera centre at (540, y0 + 960) screen = world, so you can place by screen coordinates.
- **Titles stack:** split a long word into two lines ("SNOW" / "BALL", cap height about 195 px, each line at most 850 px wide; check with `textWidth`). A title that fits 16:9 at 175 is far too wide here. Put a drawing under it (the rolling, growing snowball) so the lower third is never empty.
- **Diagrams are tall:** axes about 740 wide x 640 high, a heading in the top safe band, labels 50-95 px, the curve steep so it uses the height. Push in at the end (zoom 1.1-1.2) on the one answer; keep every label fully in or out of the shot.
- **Type:** titles 195 px cap, headings 95-120, labels 50-80, never below 44 px; at most about 4 words per line. Captions are drawn by the engine in vertical mode: up to two lines, at most 800 px wide, ending above y 1470.
- **One focal point:** one thing is written at a time per region; the camera rides the pen or the coin up the curve instead of cutting to a wide view.
- **No dead holds:** keep a slow push or drift in the camera and a stroke or coin move running; nothing static over 1.2 s.
- **Keep the whole chart inside x 90-940 in every shot, not only at zoom 1:** screen x = 540 + (x - cx) * zoom. Axes 740 wide centred on x 540 allow zoom up to about 1.06 with cx 540; moving cx sideways or zooming past 1.1 clips the axis and heading. Check the axis, heading and every label at the tightest camera key.
- **Captions (52 px, up to two lines) occupy y about 1250-1450.** Keep chart bodies, axis labels and arrows above y 1230 in every shot, including after the push drifts content down; never write a label where a caption will sit.
- **Ending:** do not shrink the board into a corner. End on a push into the answer, or an image that fills the frame (the circled gap centred, the title or one number big). A zoom below 0.9 leaves the top empty and puts the chart under the platform UI.
- **Labels:** at least 64 px for axis and curve labels, in ink or colour (never ghost grey); keep ghosts faint and few in the lower band.
- **Pitfalls:** 16:9 title sizes overflow the width; a graph baseline below y 1250 collides with the two-line caption; a label at the very top or right edge lands under platform UI; a long whip (over 2000 px) bands badly in the shutter blur, keep regions about 1500 px apart; the pulled-back "whole board" ending does not work in a tall frame, end on a push into the answer.

