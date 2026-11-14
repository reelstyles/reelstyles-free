# Dark Keynote: style

A launch film where software is the star. Near-black navy stage, hairline grid, raised navy surfaces with a 2 px hairline border, one mint accent, UI that snaps on the beat, a giant number. Every shot is a lit place seen through a moving camera. Not a glass render, a real-OS screencast, a scanline HUD or a chart film.

## Look
- Every shot is a full set from `PLACE.stage()`, `PLACE.room()` or `PLACE.hall()` (sets/places.js): back wall or horizon in the far layer, a perspective grid floor with a light pool, 3+ props on the sides, a soft near layer at the bottom corners. The centre (x 300-780) stays free for the subject. Frame 0 is already the whole lit set.
- One visible light per place (spot, lamp, ceiling bar, moon). It lifts the stage around it, draws a beam or halo, and `DKL.rim()` puts a rim and glow from it on the subject.
- Grade per mood, `DKL.GRADES`: `night` (cold blue), `alarm` (coral: the problem), `focus` (neutral), `win` (mint), `gold` (warm payoff). Turn it across the film (dim or coral at the start, mint or gold at the payoff) and inside a shot with `DKL.grade(a, b, k)`.
- Air and texture are automatic: drifting motes and floor haze in the light colour, film grain, vignette by grade.
- Surfaces: raised steps `#151A26` to `#232B3F`, inner top highlight, soft black shadow, 18-26 px corners. Light comes only from `var(--light-rgb)` (the grade) and the accent.
- Spawns are a 0.28 s back-out drop; landings squash 10%. A light sweep is a soft band at 16% or less, skewed -12°.

## Palette
- Stage `#06080D`, surfaces `#0E121B`, `#151A26`, `#1D2332`. Text `#F2F5FA`, `#9AA3B5`, `#6A7387`.
- Accent mint `#7CF5C8` marks the product, the action, the number and confirmations. Swap with `DKV.film({accent})`: violet `#9B8CFF`, signal orange `#FF8A3D`, lime `#B7F34A`.
- Problem coral `#FF5C6C` exists only while the problem exists (badges, alarm LEDs, the `alarm` grade). After the turn it never returns.
- Category hues (blue `#7CA8FF`, amber `#FFB454`, violet `#B58CFF`, green `#5ED6A8`) only on small glyphs, shelf tabs, plant leaves.

## Type
- Inter 900 for headlines and the giant number (tracking -4.5%); Inter 800 72 px for the one label per picture; JetBrains Mono 500 uppercase, wide tracking, for window titles and in-world signs (`DOWNTIME`).
- Nothing under 40 px on 1080 wide; the giant number 300-540 px, alone with its sign, inside a screen or as the hero.
- Labels: `DKV.label(html)` + `DKV.say(label, u)`, placed by the guard above the hero. `<b>` is mint, `<i>` coral (the problem only). At most 4-6 words, never the whole story.

## Cast and props
- The hero is the product as a character: `DK.hero(parent, {title})`, an app window with a screen face (`calm` caret, `worried`, `happy`, `surprised`, blinks), poses `idle`, `walk`, `reach`, `cheer`, `slump`, bodies `mess`, `sorted`, `check`, `blank`, a coral badge, a contact shadow. It tracks itself for the layout guard.
- Generic props in the kit's surface language (sets/props.js), each standing on (x, y) with a contact shadow: `DKP.rack()` (LEDs to colour), `DKP.desk()`, `DKP.monitor()` (`._screen` for story content), `DKP.lamp()`, `DKP.plant()`, `DKP.shelf()`, `DKP.plinth()`, `DKP.truss()`, `DKP.tower()` (skylines), `DKP.post()`. Build anything else from `DKP.box()` the same way, and prove it reads on one still first.
- UI pieces: `DK.win()` window cards, `dk-pill acc` buttons, `dk-num` giant number, `dk-label` mono labels, `dk-sweep` light band, `DK.rng(seed)` for generated piles.

## Camera and motion
- Default: wide or medium-wide. Subject feet at screen y 1560 with `DKL.aimY(feetY, s)`, hero scale 0.66-0.8 at zoom 0.86-1.0, so the hero is 30-55% of the frame, the floor under it and the set plus label band above. Close-ups are short beats.
- Every picture moves: `DKL.move(kind, x, y, s)` gives `push`, `pull`, `pan`, `panL`, `crane`, `drift`. `DKL.frame(t, {cam, grade, place})` drives the camera and the parallax (far 0.5x, near 1.4x), light, air and grain every frame.
- A new picture every 2 s (`keys(0, 2.0, list)`): neighbouring pictures change place, zoom or angle, and pose.

## Native moves
- The turn: coral to mint. LEDs, graphs and badges flip in a wave while the grade goes `alarm` to `win`.
- The snap grid: items fly into typed rows and become 96-118 px tiles; a light band sweeps them on.
- The click: pointer or hero reaches a `dk-pill acc` button, it squashes, ripples spread.
- The giant number: from glyph noise, one digit locks per beat, on its own shot (a stage screen or alone).
- Put-away: a surface squashes to a line, then a dot that grows into the next shot. Transitions are cuts or this, never fades.

## Pitfalls
- An empty navy frame is the failure of this style: never a shot without a place; never a hero floating without the floor and its shadow.
- Murky: keep the light in frame or its beam visible; grade `night`/`alarm` still needs the lit pool and rim.
- Props and buttons stay 65 px inside the frame at every zoom of the move; only walls, floor and the near layer may bleed.
- Labels never cover the face or the key object; a button stays clear of the hero card.
- A tracked element under 25% opacity is not measured: start fades at 30%.
- Keep `data-duration` on `#dk-stage` equal to the film's duration.

## Files
- 9:16 (1080x1920): `cp templates/vertical.html index.html && cp templates/film-v.js film.js`, edit `film.js` (`DUR` = `data-duration`). Load order: gsap, `engine/dk.js`, `engine/dk-v.js`, `engine/safe.js` (layout guard), `engine/look.js` + `engine/look.css` (grade, light, layers, air, grain, camera), `sets/props.js`, `sets/places.js`, `characters/cast.js`, `film.js`.
- `templates/film-v.js` is a short worked example: three places, a grade turn, the click, the number. Change the story, keep the shape.
- 16:9: `templates/index.html` with the film script inline at its bottom (engine/dk.js `DK.camera()`, `DK.toast()`); render with `--workers 2`.
- Render with `bash tools/render.sh` (lint, layout check before rendering, then `tools/vcheck.sh`); it names the film `out.mp4` only when every check passes. Dead-hold check: `node tools/holdcheck.mjs out.mp4`.
- End card only when asked: `DKV.end(t0, t1, lines)`.
