# Dark Keynote: style

## Essence
A launch film for **software** where the interface is the star. A near-black navy stage, a hairline grid, one soft light, **one accent** (mint `#7CF5C8` by default) and UI that snaps to a grid on the beat. Light reveals, one giant number, then empty space. It is not a glass product render, not a screencast of a real OS, not a HUD with scanlines, not a chart film (one number, not a chart).

## Materials (all drawn in HTML/CSS, no images)
- **Stage**: `--s0 #06080D`, a radial lift at the top centre, one big accent glow at ~10 % that drifts across the film, a 55 % vignette. Hairline grid on a 48 px module (3 % white, every 4th line 6 %).
- **Surfaces**: three raised steps `#0E121B / #151A26 / #1D2332`, 1 px border (9 % white), 1 px inner top highlight, soft black shadow.
- **UI kit** (`DK.win`, pills, tags, labels): windows with a glyph + mono title (never traffic lights, menu bars or docks), notification badges, file tiles, pills, mono labels.

## Palette
Neutrals are slightly blue: text `#F2F5FA` / `#9AA3B5` / `#6A7387`. **Accent** `#7CF5C8` = the product, the action, the number's unit, confirmations; swap per film (violet `#9B8CFF`, signal orange `#FF8A3D`, lime `#B7F34A`) via `DK.init({accent})`. **Problem colour** coral `#FF5C6C` only while the problem exists (badges on the pile); after the turn it never returns. Category hues (blue `#7CA8FF`, amber, violet, green) only on small glyphs.

## Type
Inter 900 for headlines and the giant number (tracking -4.5 %), Inter 500 for toasts, JetBrains Mono 500 for titles, labels, status (wide tracking in labels). **Nothing on screen is under 28 px at 1080p**: CSS enforces it and `DK.audit()` raises any stray text to 28 px at load. Captions are a UI component: `DK.toast` (pill, 40 px, accent dot), sized to its text and fitted to its box, never clipped. The number gets its own shot and no caption over it.

## Motion grammar
- **Nothing is ever static.** The glow and grid plane drift for the whole film, every shot has a camera move (`DK.camera`), every held element breathes (`DK.alive`, 5-6 px, 0.5-0.7 s period), the caret blinks. Longest still of any lit pixel < 1.2 s (`tools/holdcheck.mjs` proves it).
- Spawns are 0.28 s `back.out(1.7)` drops; flights curve because x and y use different eases (`power2.out` on x, `power3.inOut` on y); landings squash 10 % for 2 frames; disappearing is designed (CRT-off squash to a line, then a dot that expands into the next shot).
- Moves start a beat early and land on it; no linear easing except a deliberate scrub.
- Transitions are UI expand/collapse: dot grows into the next stage, pile collapses to a tile row. No fades between shots.

## Camera grammar
Pull-back through accumulation (scale 1.22 to 0.94), push-in on the click, lateral light sweep over a settled grid, slow push on the number, slow push on the end card. One focal point per shot: caret, button, grid, number, wordmark. Max 3 study elements (a row label, the grid, the toast).

## Sound
Silent is valid. If you add sound: marimba/felt ticks in one mode for the product, detuned scattered clicks for the pile, a low sine drop on the click, digital silence for the beat before the number.

## Native moves
Generated accumulation (48 windows by rule), the snap grid, the living element (caret and pointer), light reveal (soft band, tiles turn on as it passes), number from glyph noise (digits lock one per beat), put-away (button retracts to a dot), freeze (drop the camera and sound for a beat).

## Variation space
Countdown checklist ending on "shipped" · split-screen old vs new workflow · zoom ladder pixel → component → screen → fleet · number-first open · plan view of an empty grid that fills · one tile left lit at the end.

## Pitfalls
A hard white glint reads as a sticker (soft band, <= 16 %). Too few generated items leave holes in a grid: generate by rule, then pad. Flat tinted rectangles for "closing" look like placeholders: squash the real surface. Never run the film script as an external `<script src>`: the bundler runs it before the stage exists, keep it inline in `index.html`.

## Kit details that are easy to miss
- The film script is **inline** at the bottom of `index.html`; the engine (`engine/dk.js`, `dk.css`) is loaded from `<head>`.
- Hide any element that appears later with `gsap.set(..., {opacity:0})` or an inline `opacity:0`; `fromTo(..., immediateRender:false)` leaves it visible before its start.
- Keep `data-duration` on `#dk-stage` equal to `TOTAL`.
- Stage elements live in `#dk-cam` (the camera) so the grid moves with it; toasts live in `#dk-hud` (no camera).
- Lift content above the toast (bottom 64 px + 90 px height) so it never covers the study element.
- Render with `--workers 2`; `snapshot` has no `--workers` flag.
