# Mid-century cartoon ("midcentury-toon"): style

1950s flat-colour limited animation: every fill printed a few px off its broken ink line, geometric people whose body is a held drawing while hands, eyes and props move, colour-plane sets, numbered medallions, starbursts and sparkles. For how-to films and any story told in steps.

## Look

- **Start every shot from a scene recipe** (`sets/recipes.js`); frame 0 is then already a full, lit set:
  - `setLand(g, {mood, light, far: 'hills'|'peaks'|'city'|'sea', fy, props, near: 'grass'|'pines'|'rocks', air, subject})`
  - `setRoom(g, {mood, light, fy, wall, paper: 'dots'|'stripes'|'atoms', window, wallProps, props, rug, near: 'plant'|'curtain', air, subject})`
  - `setStreet(g, {mood, light, fy, shops, props, near: 'hedge'|'rail', air, subject})`
  - `props` = `[[name, x, s, y?]]` standing on the floor line `fy` (default 800). Use 3+ per shot.
  - `floor: (c) => ...` draws ground marks behind props and the light; `subject: (c, L) => ...` draws the main character with the scene light `L` (see Cast).
- **Grade per mood** (`engine/look.js`, `GRADES`): `day` · `dusk` · `night` · `hearth` · `gold` · `cool`. The mood picks sky, far, ground, wall and floor colours and the frame shade. `gradeTrack([[t, mood, blend]...])` turns the shade across the film: cold or dim first, `hearth` or `gold` at the payoff.
- **One light per scene:** `light: {kind, x, y, s, k}`, kind `sun` · `moon` · `lamp` · `fire` · `window`. The frame darkens with the mood except in stepped, printed halo rings around the source. Dark places stay dark, lit only by their source. Any extra source: `lightSrc(g, L, t)`.
- **Depth:** recipes draw sky (parallax 0.25), far (0.45), mid (0.7), floor + subject (1) and a dark near layer at the frame edges (1.5). Your own layers: `depth(g, p, fn)`.
- **Air:** `air: 'dust'|'snow'|'rain'|'embers'|'leaves'|'fireflies'` (one per scene; `airAt: {x, y, w, h}` aims embers).
- **Texture:** off-register colour (`REG`, re-rolled on twos), dry-brush tooth in every fill, paper grain and warm vignette last. Shading: one flat plane or `halftone()`, never a gradient.

## Palette

`PAL` in `engine/toon.js`: paper `#F3E8D0`, ink `#2B2420`, coral `#E65A38`, mustard `#EBB236`, teal `#35A59B`, sky `#9CC4D8`, olive `#8C9446`, rose `#E58F8A`, plum, kraft, denim, chrome. Set colours per mood live in `GRADES`. One accent hue per film; a product or story object keeps one colour throughout. Nothing neon or pure.

## Type

- The one caption of a shot: `label(g, t, t0, t1, str, x, y)`, Alfa Slab 64 px on a white card with a mustard offset plate; card and text pop in and leave together. 4 words or fewer, in the sky or an empty corner, never over a face.
- Poster and end titles: `title()` (script kicker, slab line, spaced sub). `caption()` (Jost 44 px card, bottom centre), `tag()`, `banner()`, `stepHeader()` for manual-style films.

## Cast and props

- `drawPresenter(ctx, pose)` (`characters/presenter.js`): June or Walt (`OUTFITS`, or your own entry), view `q`/`front`/`side`/`back`, `kneel`, hands `open`/`point`/`grip`/`flat`, faces, `blink`, `look`, `prop: {kind: 'mug'|'phone'|'clip'|'pot'}`. Feet at (x, y); s 0.85-1.0 = 45-52% of the frame height (kneeling about 37%).
- Light the subject: `lit(c, L, [x, footY, height], (d) => drawPresenter(d, pose))` gives a cast shadow away from the light, a rim on the side facing it and a flat shade plane on the far side.
- Arms move by angles (`armF/armB {a1, a2}`, 0 = right, π/2 = down); hand position: `armJoints()` + `toScreen()`.
- Generic props, `prop(g, name, x, y, s)`: pine, tree, bush, rock, tent, fence, lamppost, bench, house, table, chair, lamp, plant, shelf, crate, sign, log, mailbox, cactus. Wall props in `setRoom`: clock, atom, frame or any prop name. `fire(g, x, y, s, t, k)` is a flame on logs.
- Story objects are yours: flat `shape()` fills with an ink line, prefixed helpers in film.js, proved on a still first.

## Camera and motion

- `camMove(kind, t0, d, {x, y, z, amt, dir})` returns the shot camera: `push` · `pull` · `pan` · `tilt` · `crane` · `drift`. Default wide (z 1.0-1.1); a close beat on hands or an object z 1.3 for one shot.
- Twos: poses, hands, cel jitter at 12 fps (`twos(t)`); camera, iris, wipes and air at full rate.
- A hand action = anticipation → fast action (0.15-0.25 s) → settle, one per 2 s picture.
- Pop-ins scale in with a back-ease: `pop(t, t0)`.

## Native moves

Iris through the step's numbered medallion (`transition(tc, 'iris', {at, label})`) · a hand action landing on a beat · round call-out (`callout()`) as the close-up · a sunburst behind the reveal (`curtainBurst()`) · do/don't split (`planeSplit()`) · function becoming ornament at the end · the grade warming as the result appears.

## Pitfalls

- Never open on a bare paper wall: open inside a recipe, mid-action.
- One hero per shot; neighbouring shots change angle (dir, camera kind or x).
- Keep halos off faces and labels: put the light beside the subject, not behind the head.
- Props stand on `fy` or lower; never float.
- `lit()` and `lightSrc()` read the shot camera: call them inside `subject` or after the recipe, never before it.
- An iris draws the outgoing shot under it: keep shots valid a little past their end.
- Deterministic: `hash()` / `rng()`, never `Math.random` or `Date`. Prefix your own helpers; never redefine kit globals (`label`, `fire`, `prop`, `depth`, `air`).
- 9:16: text and faces inside x 90-940, y 250-1470; the hero at least 60% of the frame height; `vSay()` labels; `tools/vcheck.sh` must pass. Lessons from real builds: `LESSONS.md`.

## Files

- 16:9: copy `templates/index.html` to `index.html` and `templates/film-look.js` (every look tool, start here) or `templates/film.js` (classic how-to) as `film.js`. 9:16: `templates/vertical.html` + `templates/film-v.js`. `data-duration` = `DUR`; end with `mountFilm(DUR)`.
- Load order: gsap → `engine/runtime.js` → `engine/toon.js` → `engine/manual.js` → `engine/look.js` → `characters/icons.js` → `characters/presenter.js` → `sets/sets.js` → `sets/recipes.js` → `film.js`.
- Stills: `npx -y hyperframes@0.8.96 snapshot . --at 1,3,5,7,9 --no-end -o snapshots`. Render: `bash tools/render.sh out.mp4` (lint, render, checks), foreground.
- Sound (optional): cool jazz, foley, one `<audio>` clip in `#root`.
