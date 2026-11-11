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
- The film script must stay inline at the bottom of `index.html`. As an external `<script src>` the bundler runs it before the stage exists.
- Hide late arrivals with `gsap.set(..., {opacity:0})` or inline `opacity:0`; `fromTo(..., immediateRender:false)` leaves them visible early.
- Keep `data-duration` on `#dk-stage` equal to `TOTAL`.
- Keep content above the toast zone (bottom 64 px plus 90 px).
- Randomness only through `DK.rng(seed)`.
- Giant number alone on its shot, headlines on one line.
- End on one resolved image: wordmark, tag, a single caret.

## Files
- Copy `templates/index.html` to the kit root and edit the film script at the bottom (shots, `TOTAL`, `data-duration`). The kit is 16:9 only (1920x1080). There is no 9:16 template.
- The engine is `engine/dk.js` and `engine/dk.css`, loaded from `<head>`. Do not edit it for a film.
- Render with `--workers 2`. `snapshot` has no `--workers` flag.
- Dead-hold check, mandatory before hand-over: `node tools/holdcheck.mjs out.mp4` (limit 1.2 s). Each hit is a lit region that did not move: add camera drift, `DK.alive` breathing or a staggered build, re-render, until it prints `holdcheck: ok`.
- Sound is optional. Foley with ffmpeg: a click is `ffmpeg -f lavfi -i "sine=f=1800:d=0.03" -af afade=out:st=0:d=0.03 tick.wav`, the press drop `sine=f=140:d=0.25` with a fade, mixed at -14 dB under the voice. Marimba ticks for the product, detuned clicks for the pile.
