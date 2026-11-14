# Countdown guessing quiz

A game-show quiz filmed like a studio broadcast: one drawn item per round stands lit on a set, a 3 s ring drains, the silhouette floods with colour, the name springs in. Identity: candy band gradients, chunky rounded type, ring, colour wipe, confetti.

## Look

- Every 16:9 round is a full lit set: `drawSet(name, t, grade, band, hero)` (`sets/scenes.js`) draws three parallax layers: far (wall or sky), mid (floor, light, props, hero, dust), near (foreground).
- Scene recipes (`SETS`): `studio` (LED arch in the band gradient behind the hero, marquee bulbs, light columns, glossy floor, pedestal, podium, truss spotlight, footlights), `outdoor` (sky, sun or moon, 2 hill rows, tree, fence, signpost, rock, grass in front), `room` (wall, window light, shelf, picture, floor lamp, rug, side table). New place: copy a recipe; keep floor, back, 3 props, one light.
- Light: one source per set (`lightSource()` core + bloom, `beam()` cone with a floor pool). The hero gets a rim in the grade's rim colour (`Hero(..., { rim })`) and a `contactShadow()`.
- Air: `dust()`, `haze()`. Texture: `finish()` (grade tint, vignette, grain) last, in screen space.
- Frame 0 is already the full set with the item in place (mid-drop). No title card first.

## Palette

| Band | Gradient (LED arch, title) | Silhouette | Accent |
|---|---|---|---|
| easy | `#46E39B` → `#17A6D6` | `#0F5C8A` | `#FFE14D` |
| medium | `#5C9BFF` → `#9457FF` | `#2D1B7A` | `#FFE14D` |
| hard | `#FFA63D` → `#FF3D86` | `#7A1A4A` | `#FFF0A0` |
| impossible | `#C0143F` → `#2A0A55` | `#12041F` | `#FFD84A` |

`BANDS` in `sets/stage.js`. `GRADES` (`sets/look.js`) set wall, floor, key, rim, haze, tint, vignette, LED brightness per mood: `show` (default plum studio), `night` (cold blue, dim), `warm` (amber), `tense` (red, the last second), `win` (bright, gold rim). `gradeMix(a, b, k)` blends them. A round turns: its `mood` → `tense` in the last second → `win` after zero. Confetti: accent, white, `#FF5FA2`, `#5CE1FF`, `#8DFF7A`.

## Type

Inter 900 (`fonts/`), chunky by a same-colour round-join stroke and a soft plum shadow. Upper case, 2-4 words. Always `text()` (wraps, fits `maxW`, clamps in screen coordinates, min 30 px), never inside a translated ring. 16:9: prompt 64 px on a dark plate under the ring, answer 140 px dark on an accent plate with an accent glow where the ring was, band word 250 px.

## Cast and props

No people. The items in `ITEMS` (`sets/items.js`) are the cast, drawn by `Hero(it, t, o)` (`characters/cast.js`): `o.foot` the floor y it stands on (a wide item never floats), `o.h` height (16:9 `HERO_H` 450 = 42 % of the frame), `o.w` max width, `o.rim` / `o.rimDir` rim light, `o.pose` `idle` | `walk` | `reach` | `cheer` | `slump`, `o.mood` `calm` | `tense` | `happy`, `o.in` entrance, `o.sil` silhouette tone, `o.wipe` colour reveal.

- Shapes: `apple`, `banana`, `strawberry`, `pineapple`, `elephant`, `cat`, `fish`, `duck`. Flags: `japan`, `italy`, `sweden`, `switzerland`.
- Add an item to `ITEMS`: `{ name, kind:'shapes', shapes:[{ c, ops, x? }] }`; ops `['e',x,y,rx,ry,rot]`, `['r',x,y,w,h,rad]`, `['p',[x,y,...]]`, `['l',[x,y,...],width]`; body first, details `x:1` (left out of the silhouette).

## Camera and motion

- Default framing: wide or medium-wide, the item 30-55 % of the frame height on its floor, nothing important within 65 px of an edge. The HUD column (ring, prompt, answer, score) sits right of x 1200, so keep the item left of it.
- A round cuts between shots: `quizRound` uses `defaultShots(set, tin, len)` (wide push → medium-wide → 1 s close beat in the last second → wide reveal → medium-wide payoff) or `cfg.shots` = `[{ at, z0, z1, x0, x1, y0, y1 }]` read by `shotCam(L, shots, dur)`. Neighbouring shots differ in zoom or side. `CAM` drives `layer()` parallax; `toScreen()` maps a world point to the screen.
- Pass `{ cam: () => ({ z: 1 }) }` to `beat()` for set rounds (the camera lives in the round). Ease every move (`EZ`, `seg`); only the ring is linear. Never `spring()` near an edge (40 % overshoot).
- Idle life: bulbs chase, columns pulse, LED stripes drift, dust rises, the item breathes.

## Native moves

Spring in, 3 s ring, flash, colour wipe, name pop, score tick. Variations: double round, "which is bigger" split, streak counter, longer bonus ring (`T_RING`), reversed round, fake-out tick, `encore` (second confetti burst on the last shot). Move the round to a place that fits the item (`set: 'outdoor'` with `mood: 'night'` for an owl, `room` for a teapot).

## Pitfalls

- Judged 11-13: flat, generic gradient frames. Never draw a round without `drawSet()` and `finish()`.
- Cut a shot at least every 2 s; nothing holds still over 1.2 s.
- The silhouette must be guessable at phone size; the reveal colours match the name.
- `data-duration` = sum of the `beat()` lengths.
- Seeded `rng` only. No second display font, no logos.

## Files

- 16:9: `cp templates/index.html . && cp templates/film.js .`, edit `PLAN` (`{ band, item, prompt, set, mood }`). Per band `beat(1.3, ...titleCard)` then `beat(ROUND_LEN, ...quizRound)`; end with `mountFilm(total)`. Round cfg: `{ band, item, prompt, n, score, total, set, mood, tin, len, shots, pose }`.
- 9:16: `cp templates/vertical.html index.html && cp templates/film-v.js film.js`, edit `PLAN` (`{ band, item, prompt, pose }`). `quizRoundV` (`sets/stage.js`): the item is the hero (740 px, centre 540,1000), label band y 270-500 (round pill 66 px, prompt plate 72 px, answer 112 px), the ring a 440 px halo with a 200 px badge under it, one set per countdown second (`calm`, `burst`, `danger`, `win`) so a new picture lands every 1.3 s; rounds 4.6 s; `endCard(DUR - 2, DUR, [...])`.
- Look layer: `sets/look.js` (grades, camera, light, air, grain), `sets/scenes.js` (recipes). Load order: runtime → look → items → scenes → stage → cast → film.
- Render: `bash tools/render.sh` (lint, layout check, render, checks). `engine/safe.js`, `tools/vcheck.sh`, `tools/layout-check.mjs`, `tools/render.sh` are shared: do not edit.
- Stills: one per shot, e.g. `--at 0,1,3,5,7,9`.
- Lessons: `LESSONS.md`.
