# Whiteboard explainer: style

An explainer drawn live on one glossy dry-erase board, 45-120 s: money, science, "how does X work". Handwriting is written stroke by stroke, floating markers lead the eye, a magnet coin slides, a felt eraser wipes. No hands, cursors, photos or icon packs. Text is never faded in as a block.

## Look

- Board: warm white gradient, world-locked scuffs, faint ghost marks of old lessons (`ghosts()`), a drifting window sheen, a light vignette.
- Ink: opaque marker, chisel tip (thicker on one diagonal), pressure ramp at the start, taper at the end, a pooled dot in long strokes (0.36 × width, never larger), wobble plus fine tremor.
- Stroke width 9-12 px at 1920, 10-14 px vertical. `write()` uses 0.056 × size, minimum 5.
- Every stroke eases slow-fast-slow. Give `draw()` and `write()` a start time and duration; the engine solves the speed. Label 0.3-0.8 s, title 1.2-3 s.
- Pens hop between strokes, park off-frame in gaps over 1.8 s, fly back 0.55 s before the next stroke. Two colours at once means two pens.
- Magnet `lift` 1 → 0 is a drop: shadow shrinks, a clack. Eraser: zig-zag at constant speed, 90 % strength, a ghost always remains.

## Palette

- board `#f7f6f1` / `#ecebe4`; ink `#20242b` (things, structure)
- `col: 'sig'` `#177f8c` (process, the thing in motion)
- `col: 'hot'` `#e0523b` (the one accent, one per region)
- highlighter `#ffd84a`; ghost `#8a96a8` / `#9fb2c8` at 9-11 %

At most three marker colours, each keeps its meaning all film. Monochrome variant: all ink, one `hot` element. Alternative set: navy `#1f2a44`, green `#2e8b57`, red `#c8363a`; edit `PAL` in `engine/wb.js`. 

## Type

- Board text is the single-line hand (EMS Tech) via `write()`. `y` is the baseline, `size` the cap height.
- 16:9: title 150-200 (8 capitals need ≤ 175), labels 40-70. Test with `textWidth(str, size)`.
- 9:16: title 195 in stacked lines of at most 850 px ("SNOW" / "BALL"); headings 95-120; axis and curve labels 64-95.
- Captions come from `caption(text, t0, t1)`: off-white rounded label, Architects Daughter, accent dash. 16:9: 44 px. 9:16: 52 px, two lines, 800 px wide, y about 1250-1450. Hold at least max(1.8 s, speech + 0.6 s).
- Characters missing from `fonts/ems-tech.js` become `?`.

## Cast and props

No characters. Everything is a few marker strokes, passed to `draw(shapes, t0, dur, {col, w})`.

- `line`, `curve`, `fn(f, x0, x1, n)`, `circle(cx, cy, rx, ry, a0)`, `box(x, y, w, h, r)`, `arrow`, `dashed`, `check`, `underline`.
- `axes(x, y, w, h)`, `bars(x, y, ws, hs)`, `highlight(x, y, w, h, t0, dur)`.
- `person(cx, cy, s)` stick figure (cx, cy = feet), `bulb`, `bubble(x, y, w, h, tail)`.
- `magnet({col, r, label, keys: [[t, x, y, lift]...]})`, the only moving prop. `erase(t0, t1, x, y, w, h)`.
- `write()` returns `{x0, x1, y0, y1, t1, cx}` for placing underlines and circles.

## Camera and motion

`cam([[t, cx, cy, zoom, roll]...])`: eased between keys, roll 0.006-0.012 rad on whips, blur automatic. World = pixels, default centre (960, 540).

- Hold: read this now (equation, list).
- Whip to a new region, 0.8 s: a new idea, a "but".
- Slow push into a symbol: this term is the point.
- Ride the pen: one thing leads to the next.
- Return to an old region: a free callback.
- Pull back to the whole board: the lesson as one picture, last 2 s.

Regions sit far apart: about 2200 px in x (16:9), about 1500 px in y (9:16). A whip over 2000 px bands in the blur. One thing is written at a time per region. Never cut on the board.

## Native moves

A formula written term by term as it is said · the pen leads the camera along a line · a magnet is the only thing that moves (a coin, a truck, a cell) · the eraser rewinds a result · two pens at once for a duet · a ghost of the old lesson becomes relevant · highlighter under the answer, then circle it · the full-board pull-back ending (16:9).

Opening: a huge `?` shrunk into the first dot. Endings: the answer circled twice · the board wiped except one line · a push into the smallest symbol.

## Pitfalls

- One overloaded pen drifts late. Give each drawing its own `t0 + dur` window; use another colour for overlapping jobs.
- A period is a 1 px stroke; the engine turns sub-width strokes into dots.
- Eraser paths must not cross text you keep.
- Keep ghost marks few and faint in the lower band.
- Vertical charts: axes about 740 × 640, steep curve, heading in the top band. Screen x = 540 + (x − cx) × zoom, so axes 740 wide at cx 540 allow zoom up to about 1.06. Drifting sideways or zooming past 1.1 clips them. Check the tightest camera key.
- Vertical: keep chart bodies, labels and arrows above y 1230 in every shot, also after a push drifts content down.
- Vertical ending: push into the answer (zoom 1.1-1.2). Below zoom 0.9 the top is empty; the pulled-back board fails in a tall frame.

## Files

- 16:9: copy `templates/index.html` and `templates/film.js` to the kit root. 9:16: copy `templates/vertical.html` as `index.html` and `templates/film-v.js` as `film.js`. `engine/wb.js` takes the frame size from the canvas, so it draws both.
- Edit `film.js` only. Register everything with times, end with `mount(DUR)` as the last line. `DUR` must equal `data-duration` in `index.html`.
- Vertical: at zoom 1 with centre (540, y0 + 960) screen = world.
- Sound: `node tools/foley.mjs film.js audio/foley.wav` builds the marker sounds (strokes, squeaks, magnet click, eraser rub, room tone) from the film's own schedule. Add it as an `<audio>` clip, about 11 dB under the voice. A silent film is valid.
- Vertical check: `ffmpeg -i out.mp4 -vf freezedetect=n=-50dB:d=1.2 -an -f null -` must print no freeze.
