# Whiteboard explainer: style

An explainer drawn live on one glossy dry-erase board: money, science, "how does X work". Handwriting is written stroke by stroke, floating markers lead the eye, a magnet coin slides, a felt eraser wipes. No hands, cursors, photos or icon packs. Text is never faded in as a block.

## Look

- Board: warm white gradient, world-locked scuffs, faint ghost marks of old lessons (`ghosts()`), a drifting sheen, a light vignette.
- Ink: opaque chisel marker, pressure ramp, taper, a pooled start dot, wobble plus tremor. Stroke width 9-12 px at 1920, 12 px vertical (the default there).
- Every stroke eases slow-fast-slow: give `draw()` / `write()` a start time and duration, the engine solves the speed. Label 0.3-0.8 s, title 1.2-3 s.
- Pens hop between strokes and park off-frame in gaps over 1.8 s; two colours at once means two pens.
- Magnet `lift` 1 → 0 is a drop with a clack. Eraser: zig-zag, a ghost always remains.

## Palette

- board `#f7f6f1` / `#ecebe4`; ink `#20242b` (things, structure); `sig` `#177f8c` (process, the strong way); `hot` `#e0523b` (the one accent, the weak way); highlighter `#ffd84a`; ghost `#8a96a8` / `#9fb2c8`.
- At most three marker colours, each keeps its meaning all film. Edit `PAL` in `engine/wb.js` for another set.

## Type

- Board text is the single-line hand (EMS Tech) via `write()`: `y` = baseline, `size` = cap height; test with `textWidth(str, size)`. Missing characters become `?`.
- 16:9: title 150-200, labels 40-70; `caption(text, t0, t1)` = 44 px subtitle, held max(1.8 s, speech + 0.6 s).
- 9:16: `label()` above the hero (below), board words 64 px or more.

## Cast and props

Max (`characters/cast.js`): a marker-drawn man, black hair cap, teal shirt, navy trousers, ink outlines that boil 8 times a second, drawn live every frame. `hero(t0, t1, {x, y, s, dir, pose, ex, hold, reveal})`: (x, y) = feet on the board, `s` 1 = about 890 px tall, `dir` 1 faces +x. Poses `idle`, `walk(u)`, `reach`, `cheer`, `slump`, `point`, `push`, `shrug`, `think`, `umbrella`; `blend(a, b, u0, u1)`; expressions `happy`, `sad`, `shock`, `firm`; `hold` `coin` / `bag` / `umbrella` / `key`; `reveal: 0.8` draws him on with the pen. He tracks himself for the layout guard.

Everything else is marker strokes for `draw(shapes, t0, dur, {col, w, nopen})`: `line`, `curve`, `fn`, `circle`, `box`, `arrow`, `dashed`, `check`, `underline`, `axes`, `bars`, `person`, `bulb`, `bubble`; `highlight(x, y, w, h, t0, dur, col, nopen)`; `magnet({col, r, label, keys: [[t, x, y, lift]...]})`; `erase(t0, t1, x, y, w, h)`. `write()` returns `{x0, x1, y0, y1, t1, cx}`.

## Camera and motion

16:9: `cam([[t, cx, cy, zoom, roll]...])`, eased, blur automatic. Hold (read this) · whip 0.8 s to a far region (a new idea; regions ~2200 px apart, whips under 2000 px) · slow push into a symbol · ride the pen · return to an old region · pull back to the whole board at the end.

9:16: `shot([[t, cx, cy, zoom, roll, whip, zoomEnd]...])`, one key per picture (below).

## Native moves

A formula written term by term · a magnet as the only mover · the eraser rewinds a result · two pens in a duet · highlighter under the answer, then circle it. Opening: a huge `?` shrunk into the first dot.

## Vertical pitfalls (machine-checked, 2026-11-13)

The 16:9 board on a phone was white space, 52 px captions and no one to watch. `templates/film-v.js` (32 s, six sets, 15 pictures) is the model; `bash tools/vcheck.sh out.mp4` finds the rest with times.
- **Max in every picture,** feet on the floor line at y 1540, `s` 1, zoom 0.98-1.1: 46-55% of the frame, head top at screen y ~590. The set stands on the side he faces (x 600-1000 with Max at 380, x 80-480 with Max at 700). Keep the far arm low or the edge cuts him.
- **A new picture every 2 s:** each picture in its own spot (`PIC_X` 1700 apart) with a `shot()` key: a hard cut that slides in 170 px from the side away from Max in 0.3 s, then a 4.5% push. No shutter blur across a cut. A `cam()` whip cuts Max at the edge: not in 9:16.
- **Draw the set before the camera arrives** (`nopen` strokes and highlights 1.3 s early); only the action is written on screen. Pens never fly between two spots.
- **Labels:** `label(text, t0, t1, {col})`, one per picture, written on a wiped patch above his head (`labelY()`), fitted to 730 px, 64-104 px: about 12 capitals at most. No `caption()` in 9:16 (the bottom 400 px sit under the phone's buttons).
- **One colour mass per set** (red awning, yellow jar, grey cloud, red roof) and a grey floor wash: thin lines on white look alike to the eye and to vcheck's blurred SSIM.
- **Hook:** frame 0 mid-action. **End card:** `endCard(DUR - 2, DUR, ['Made by Claude Code', 'No video model'])` over the last picture.
- Lessons from real builds: `LESSONS.md`.

## Pitfalls

- One overloaded pen drifts late: give each drawing its own window, another colour for overlapping jobs.
- Eraser paths must not cross text you keep. Ghost marks few and faint.

## Files

- 16:9: copy `templates/index.html` + `templates/film.js` to the kit root. 9:16: `templates/vertical.html` as `index.html`, `templates/film-v.js` as `film.js` (loads `engine/wb.js` → `engine/safe.js` → `characters/cast.js` → `film.js`).
- Edit `film.js` only; end with `mount(DUR)`; `DUR` = `data-duration` in `index.html`.
- Render: `bash tools/render.sh` (lint, layout check, render, checks; only a passing film becomes `out.mp4`). Vertical: `bash tools/vcheck.sh out.mp4` must print `vcheck: pass`.
- Sound: `node tools/foley.mjs film.js audio/foley.wav` builds the marker sounds from the film's schedule; about 11 dB under the voice. A silent film is valid.
