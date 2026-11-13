# Dark Keynote: style

A launch film for software where the interface is the star. Near-black navy stage, hairline grid, one soft light, one accent, UI that snaps to a grid on the beat. Light reveals, one giant number, then empty space. It is not a glass render, a real-OS screencast, a scanline HUD or a chart film.

## Look
- Stage `#06080D`. Radial lift at the top centre, one accent glow at 10% drifting across the film, vignette to 55% black.
- Hairline grid: 48 px module at 3% white, every 4th line (192 px) at 6%. The grid plane creeps 96 px x and 48 px y over the film.
- Surfaces: three raised steps, 1 px border (9% white), 1 px inner top highlight, soft black shadow. Window corners 18 px, tiles 22 px.
- Windows: glyph plus mono title, never traffic lights or docks. All HTML/CSS.
- Spawns are a 0.28 s `back.out(1.7)` drop. Landings squash 10% for 2 frames. Flights curve: x uses `power2.out`, y uses `power3.inOut`.
- Held elements breathe 5-6 px, period 0.5-0.7 s. The caret blinks every 0.4 s.
- Moves start a beat early and land on it.
- Disappearing is designed: CRT-off squash to a line (0.2 s), then a dot that expands into the next shot (scale 40, 0.5 s).
- A light sweep is a soft band at 16% or less, skewed -12°. A hard white glint reads as a sticker.

## Palette
- Surfaces `#0E121B`, `#151A26`, `#1D2332`. Text `#F2F5FA`, `#9AA3B5`, `#6A7387`.
- Accent mint `#7CF5C8` marks the product, the action, the number's unit and confirmations. Swap with `DK.init({accent})`: violet `#9B8CFF`, signal orange `#FF8A3D`, lime `#B7F34A`.
- Problem coral `#FF5C6C` exists only while the problem exists (badges on the pile). After the turn it never returns.
- Category hues (blue `#7CA8FF`, amber, violet, green) only on small glyphs.

## Type
- Inter 900 for headlines and the giant number, tracking -4.5%. Headline 150 px, number 520 px, end wordmark 300 px.
- Inter 500 for toasts (40 px). JetBrains Mono 500 for titles, labels and status, wide tracking (0.14em, uppercase).
- Nothing is under 28 px at 1080p. `DK.audit()` raises stray text to 28 px at load. `DK.fit(el,maxW,maxH,min)` shrinks text to a box, never below 28.
- Captions are a UI component: `DK.toast`, a pill with an accent dot, sized to its text. The giant number gets its own shot and no caption over it.

## Cast and props
- `DK.win(parent, {w,h,x,y,title,color,badge,lines})`: a UI window card. It has `_ci` (the card), `_cont` (bar, lines, badge) and `_ic` (a file glyph, hidden until the card morphs into a tile).
- CSS classes for `DK.el(parent, cls, html, css)`: `dk-pill acc` (action button), `dk-pill dim`, `dk-label` (mono label, `<b>` is accent), `dk-tag` (file tag), `dk-h1` (headline), `dk-num` (giant number, `<small>` is the unit), `dk-caret` (the living element), `dk-sweep` (light band).
- The pointer is an inline SVG arrow, 64 px, built in the template. `DK.rng(seed)` gives seeded random for generated piles.

## Camera and motion
- Every shot has a `DK.camera(tl, t0, t1, {s0,s1,x0,x1,y0,y1,rot0,rot1,ease})` move.
- Pull-back through accumulation: scale 1.22 to 0.94. Push-in on the click. Slow push on the number (1.0 to 1.1) and end card.
- Stage elements live in `#dk-cam` so the grid moves with it. Toasts live in `#dk-hud` and stay put.
- Longest still of any lit pixel is under 1.2 s. `DK.alive(tl, el, t0, t1, {y,x,rot,s,period})` breathes an element, `DK.blink(tl, el, t0, t1, period)` blinks the caret.
- Transitions are UI expand and collapse (dot into stage, pile into a tile row), no fades.
- One focal point per shot: caret, button, grid, number or wordmark. At most 3 study elements (focal, a row label, the toast).

## Native moves
- Generated accumulation: 48 windows made by rule with `DK.rng`, then padded so a grid has no holes.
- The snap grid: items fly to typed rows and morph into 96 px tiles, 16 px gaps. The living element: a caret that turns into a pointer.
- Light reveal: a soft band sweeps, tiles brighten from 45% as it passes.
- Number from glyph noise: `DK.scramble(tl, el, t0, locks, finalChars, o)` locks one digit per beat.
- Put-away: the button squashes to a dot, then the camera and sound freeze for a beat before the number.
- Variations: countdown checklist, split-screen old vs new, zoom ladder pixel to fleet, number-first open.

## Pitfalls
- Closing as a flat tinted rectangle looks like a placeholder. Squash the real surface.
- Too few generated items leave holes in a grid. Generate by rule, then pad.
- 16:9: the film script must stay inline at the bottom of `index.html`. As an external `<script src>` in `<head>` the bundler runs it before the stage exists (9:16 loads `film.js` at the end of `<body>`, after the stage).
- Hide late arrivals with `gsap.set(..., {opacity:0})` or inline `opacity:0`; `fromTo(..., immediateRender:false)` leaves them visible early.
- Keep `data-duration` on `#dk-stage` equal to `TOTAL`.
- Keep content above the toast zone (bottom 64 px plus 90 px).
- Randomness only through `DK.rng(seed)`.
- Giant number alone on its shot, headlines on one line.
- End on one resolved image: wordmark, tag, a single caret.

## Files
- 16:9: copy `templates/index.html` to the kit root and edit the film script at the bottom (shots, `TOTAL`, `data-duration`).
- 9:16 (1080x1920, phone Shorts): `cp templates/vertical.html index.html && cp templates/film-v.js film.js`, edit `film.js` (`DUR` = `data-duration` on `#dk-stage`). The vertical film runs on `engine/dk-v.js` (camera, sets, labels, end card, the bridge to the layout guard `engine/safe.js`) with the hero from `characters/cast.js`. Render with `bash tools/render.sh` (lint, layout check before the render, render, then `tools/vcheck.sh`); it names the film `out.mp4` only when every check passes. Check again any time: `bash tools/vcheck.sh out.mp4` must print `vcheck: pass`.
- The engine is `engine/dk.js` and `engine/dk.css`, loaded from `<head>`. Do not edit it for a film.
- 16:9 render with `--workers 2`. `snapshot` has no `--workers` flag.
- Dead-hold check, mandatory before hand-over: `node tools/holdcheck.mjs out.mp4` (limit 1.2 s). Each hit is a lit region that did not move: add camera drift, `DK.alive` breathing or a staggered build, re-render, until it prints `holdcheck: ok`.
- Sound is optional. Foley with ffmpeg: a click is `ffmpeg -f lavfi -i "sine=f=1800:d=0.03" -af afade=out:st=0:d=0.03 tick.wav`, the press drop `sine=f=140:d=0.25` with a fade, mixed at -14 dB under the voice. Marimba ticks for the product, detuned clicks for the pile.

## Vertical pitfalls (machine-checked, 2026-11-13)
The 16:9 film shrunk to a phone is a dark screen of 28 px window titles and 96 px tiles: nothing reads, and the contact sheet is nine near-identical navy tiles. The 9:16 files fix it in the kit; `bash tools/vcheck.sh out.mp4` finds the rest with exact times.
- **A hero, always.** `DK.hero(parent, {title})` is the product as a character: an app window with a screen face (calm caret, worried coral, happy arcs, surprised, blinks by itself), poses `idle`, `walk`, `reach`, `cheer`, `slump`, body `mess`, `sorted`, `check`. It tracks itself (`hero` = the card, `face` = the screen). A shot without it tracks its main object as the hero: `DKV.track(el, 'hero', name)` (the giant number, the old-vs-new card), at least 25% of the frame tall, the number at 540 px type.
- **Framing (owner 11-02, wide, never a crop):** hero whole at 30-57% of the frame (`s` 0.72-0.95 at camera zoom 0.74-1.36), screen top of the card at y >= 520 so the label has its band; cheer jumps 80 px, so give a cheering picture ~90 px more headroom. Close-ups over 70% at most 40% of the film.
- **Labels:** one per picture, `DKV.label(html)` + `DKV.say(label, u)` in render; never a y, `labelY()` puts it above the card. 72 px Inter 800 on a raised plate, `<b>` mint, `<i>` coral (the problem only). No `DK.toast` in 9:16: the bottom 400 px sit under the phone's own caption and buttons.
- **A new picture every 2 s:** `keys(0, 2.0, PICS)`; the two pictures of one set differ by a big zoom change (0.8 vs 1.3), a different pose and a different body. Dark frames look alike to the eye and to vcheck's blurred SSIM: every set needs one bright mass of its own (coral blocks, the mint button and ripples, the tile wall, the ring, the white number).
- **Element opacity:** a tracked element under 25% opacity is not measured, so a shot whose hero fades in from 0 fails "nothing tracked" on its first frame: start it at 30%.
- **End card:** `DKV.end(DUR - 2, DUR, ['Made by Claude Code', 'No video model'])`; the last picture keeps playing under it without a label. Lines are fitted while shown (a hidden element has no width).
- **Hook:** frame 0 mid-action (the pile starts with windows already falling).
- Kit lessons from real builds: `LESSONS.md` (newest last).
