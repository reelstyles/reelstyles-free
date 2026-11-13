# Kinetic type

Words are the actors. Every beat is one huge word or one stacked phrase that enters with attitude, lands and keeps moving. No characters, photos, icons, 3D text, neon or handwriting. At most one thin furniture element (brackets, rule, dot) per shot.

## Look

- Stage: flat ink, 3 blurred colour blobs (radius 560-1000 px) drifting on slow sines, a dot grid (3 px dots, 60 px pitch) sliding diagonally, a soft vignette. `drawStage` paints it.
- Letters: solid fills with a hard shadow (4% of size), or outline echoes (5 px).
- Ticker beats sit on flat colour fields (mint, pink, amber, violet).
- Rhythm: title and stack beats 1.8-2.2 s, ticker beats 0.5 s, logo 1.8-2.4 s.
- Order: title slam, stack, ticker, slot swap, logo.
- One focal point per shot, at most 3 elements (word, eyebrow, furniture). Max 6 words per shot, one word per ticker beat.

## Palette

Only `PAL`: ink `#0C0B16`, ink2 `#171428`, cream `#F6F1E7` (default text), violet `#8B5CFF`, pink `#FF4FA3`, mint `#2EE6C5`, blue `#4C7DFF`, coral `#FF6B4A`. Amber `#FFB534` is the one accent: eyebrows, logo dot, hairline.

Text on a field: ink on mint or amber, cream on pink or violet. Never violet on violet. Contrast 4.5:1 or more.

## Type

- Display: Archivo Black. `cond: 0.82` (82% width) for stacks and ticker words, full width for titles and the logo word. `cond` may go 0.7-1.0.
- Small text: Inter 800, capitals, tracked +0.22 em, eyebrows 34-40 px.
- Hero words 150 px or larger; engine minimum 28 px.
- Never draw text with raw `ctx.fillText`.

## Cast and props

No people. In 9:16 the hero is the word block (`characters/cast.js`). Calls the kit has:
- `Hero(lines, t, o)` (9:16): 1-4 stacked lines (`'WORD'` or `{s, col, size}`) as one acting block, every line as wide as fits, stretched upright to at least 32% of the frame; `o.pose` `idle` | `walk` | `reach` | `cheer` | `slump`, `o.mood` `calm` | `loud` (echoes) | `sad`, `o.t0`, `o.anim`, `o.dir`. It tracks itself as the `hero` and returns its box (for brackets or hairlines).
- `label(str, {t0})` (9:16): the one label of a picture, on an ink plate above the hero.
- `word(str, cx, cy, size, t, o)`: one animated word. Options: `col`, `t0`, `stagger`, `dur`, `anim`, `cond`, `track`, `maxW`, `mask`, `drift`, `idle`, `out: [t, dur]`, `rot`, `stroke`, `outline`, `shadow`, `free`.
- `echo(str, cx, cy, size, t, o, n)`: outline rings behind a word. Call it before the solid `word`, same arguments.
- `stack(lines, cy, size, t, o)`: poster stack. Lines are `{s, col, t0, anim}`, pitch 0.86 x size, drift alternates.
- `small(str, cx, cy, t, o)`: eyebrow or caption.
- `brackets(t, t0, col, w, h, cx, cy)`: corner brackets that close in, then breathe.
- `wipeTo(tc, dur, colA, colB, up, slant)`: slanted double colour wipe.
- A theme `{base, blobs: [[colour, x, y, radius], ...]}` is the 5th argument of `shot`.

## Camera and motion

- Entrances per letter, staggered 25-70 ms: `drop` (spring landing), `rise` (out of a mask line), `slam` (from 3.4x scale, tickers), `spin` (logo), `pop`, `fade`. Slam for loud, rise for build, drop for weight.
- A landed word never freezes: idle bob (about 1.2% of size), scale breath, drift (±14 px x `drift`).
- Camera: `pushCam(t0, t1, z0, z1, dx, dy, extra)` on every shot, push 5-8% at 16:9. Impact: pass `(t) => shake(t, t0, amp)` as `extra`.
- Easing: `EZ.o5` entrances, `spring` weight, `EZ.io` wipes.
- Cuts: hard on the beat for tickers; `wipeTo` between sections, cut under full coverage. No fades.

## Native moves

- Title slam with outline echoes; poster stack with alternating drift; colour-field ticker.
- Slot swap: static lead-in line, a rolling word in a clipped window that lands on the payoff (beat 4 of `templates/film-v.js`).
- Letters assembling into a wordmark with brackets, glint line, amber dot.
- Number slam: a huge digit, its unit in a small word.
- Word-shake on impact; a word exiting upward (`out`).

## Pitfalls

- A held word without `pushCam` or idle looks dead.
- `echo` scale above 1.15 on words wider than 1500 px leaves the frame.
- A word too long for `maxW` shrinks and warns in the console. Split the line.
- `mask: true` clips a band around the line. Put no other text in it.
- `free: true` only for scaled ghost decor.
- Every shot shows text or a ghost word from frame 1: first `t0` at or before the shot start (tickers `a - 0.05`).
- Colour-field shots last 0.5 s or more with a ghost word. Wipes 0.4-0.5 s. No flat colour shot without type.
- Nothing stands alone in the middle (cursor block, hairline): pair it with type.
- Shots tile 0..DUR with no gap.
- The logo holds 1.2 s or more with idle motion.

## Files

- 16:9: copy `templates/index.html` and `templates/film.js` to the kit root; edit `film.js`.
- 9:16 (1080x1920, phone Shorts): `cp templates/vertical.html index.html && cp templates/film-v.js film.js`, edit `film.js` (`DUR` = `data-duration` on `#root`). The page sets `window.FRAME_W = 1080` / `window.FRAME_H = 1920` and loads the layout guard `engine/safe.js` right after `engine/runtime.js`, then `characters/cast.js` (the hero). Render with `bash tools/render.sh` (lint, layout check before the render, render, `tools/vcheck.sh`); it names the film `out.mp4` only when every check passes. Check again any time: `bash tools/vcheck.sh out.mp4` must print `vcheck: pass`.
- Register shots with `shot`. `DUR` in `film.js` equals `data-duration` on `#root`. The 9:16 size also lives in the CSS, `data-width`/`data-height` and the canvas attributes.
- Do not edit `engine/` for a film (`engine/safe.js`, `tools/vcheck.sh`, `tools/layout-check.mjs`, `tools/render.sh` are the same file in every kit).
- After each render run `node tools/dead-holds.mjs out.mp4` until it prints `OK`; fix hits with a camera push, idle bob or staggered build.
- 9:16 also: ffprobe must print `1080,1920`, and `ffmpeg -v info -i out.mp4 -vf freezedetect=n=-60dB:d=1 -f null - 2>&1 | grep freeze_start` must print nothing.
- Sound is optional. Hits with ffmpeg only, placed with `adelay`:
  - slam: `ffmpeg -y -f lavfi -i "sine=f=60:d=0.25" -af "afade=t=out:st=0:d=0.25,volume=2" audio/hit.wav`
  - wipe: pink noise 0.4 s (`anoisesrc`), highpass 1200 Hz, fade in 0.15 s, out 0.25 s.
  - logo dot: sine 1760 Hz, 0.3 s, fade out.

## Vertical pitfalls (machine-checked, 2026-11-13)

The 16:9 beats squeezed into 9:16 were one 200 px word in a dark column, half the frame empty, flat colour frames from full wipes on the 1-s contact sheet, 3 px dots and 5 px rings that vanish on a phone. `templates/film-v.js` (34 s, "slow and steady wins the race") fixes it in the kit; `bash tools/vcheck.sh out.mp4` finds the rest with exact times.
- **The hero is the word block.** `Hero()` with 2-3 lines, centre (515, 1010): 32-52% of the frame tall (`minH 620`, `maxH 1000`), short words stretched upright (`tall` up to 1.6) instead of left small. One word alone is under 25% and fails "hero too small": stack it (`FAST / FAST / FAST`) or add a line. The box includes the pose's reach, so the guard and `labelY()` see the jumping letters.
- **Framing (owner 11-02, wide, never a crop):** camera zoom 1.00-1.05 only; a `reach` block gets `maxW 660` so its lean stays inside x 0-1080. No close-up over 70%.
- **Labels:** one per picture, `label('THIS ONE RUNS', {t0})`, never a y: it is drawn after the shot in screen space on an ink plate (Inter 800 caps, 76 px, never under 64, wraps to two lines), above the hero, inside x 108-918. Words of the hero are not labels; eyebrows (`small()`) stay decor.
- **A new picture every 2 s:** `keys(0, 2.0, PICS)`, hard cuts on the beat, no full-cover `wipeTo` (a 1-s contact sheet lands on a flat colour frame). Neighbouring pictures never share a dark or a light base (stage/track/slot/brackets are dark, mint/pink/amber/violet/coral fields are light), or vcheck's blurred SSIM sees one picture.
- **Sets:** `stage`, five colour `field`s with a ghost outline word (2.7x, alpha 0.22, `free`), `track` (lane rules racing past), `slot` (hairlines over and under the block), `brackets`. One furniture element each.
- **Line weights:** dots 5 px on a 72 px grid, echo rings 9 px, brackets 9 px in 9:16 (the engine does it).
- **Hook:** frame 0 mid-slam (`t0` of the first block 0.12 s before 0).
- **End card:** `endCard(DUR - 2, DUR, ['Made by Claude Code', 'No video model'])`; the last block keeps moving under it at 45% alpha, without a label.
- Kit lessons from real builds: `LESSONS.md` (newest last).
