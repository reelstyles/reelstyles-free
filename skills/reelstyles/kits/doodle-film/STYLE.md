# Doodle film: style guide

## Essence
A film that looks drawn by one person with one pen and a pack of markers on a sheet of cream paper, redrawn eight times a second. Lines tremble (line boil), colour never quite stays inside the outline, shapes are lumpy, the paper has grain. The charm is imperfection that keeps moving. It is a **scored mini story** (a beginning, a surprise, a small change, an exit) told with a round-headed kid, a cat and a few props, not a slide show of doodles.

## What it is not
Not clean vector art, not a whiteboard explainer with a hand wiping text in, not a sketch-to-photo effect, not a chart style. No gradients on characters, no shadows with blur, no 3D, no thin hairlines.

## Materials
- **Pen:** blue-black ink, 4-7 px at 1080p, drawn twice (a thick pass and a thinner, fainter second pass: "re-gone-over"). Every line is a point list that is resampled and nudged by smooth noise; the noise re-seeds on 3 drawings at 8 fps. Wide hand: `amp` 2-3 px; fast scribble: `amp` 3-5.
- **Marker:** `fillLoose` = opaque paper underlay, then the colour multiplied, shifted 5-8 px off the outline, plus a lighter diagonal scribble inside. Skin and cloth always miss the line a little.
- **Pencil grey** for shadows, clouds' squiggle underside, motes.
- **Paper:** seeded grain + fibres that shift with the boil, a soft vignette. Always on, drawn last.
- **Glow** is the only soft thing: a radial yellow halo around the one magic object.

## Palette
| role | hex |
|---|---|
| paper | `#F4EEDF` |
| ink | `#232734` |
| pencil | `#5E6272` |
| coral (hero cloth, warm accents) | `#F0645A` |
| mustard (scarf, the spark, sun) | `#F4B63F` |
| teal (trees, night grass) | `#2EA5A0` |
| sky | `#8FCBEA` |
| lilac (dusk) | `#A99BD8` |
| mint (day grass) | `#9ADBB2` |
| blush (skin, cheeks) | `#F7C3B5` |
| night | `#2C3150` |
| glow | `#FFE08A` |
Rule: **mustard + glow only on the magic object and what it lights.** The sky goes sky → lilac → night as the story turns.

## Type
Caveat (OFL, `fonts/`). Text is always on a loose paper plate (or glowing on a night plate), tilted 1-3°, typing on. Minimum 34 px at 1080p, baked in: `say()` clamps the size, wraps to fit and pushes the plate inside a 40 px margin. Titles 84-120 px, labels/captions 60-90 px. 5 words max per plate.

## Motion grammar
- Line boil on every mark, always. Characters pose on ones but boil on threes.
- **Idle life everywhere:** breathing, blinking every 2.6 s, scarf flutter, cat tail and ear twitch, grass and tree sway, cloud drift, motes drifting up through the sky (`motes()`), sun rays turning, star twinkle, paper grain shift.
- **Builds are staggered** (rays one after another 60-100 ms apart, orbiting doodles pop with `EZ.back`), and `p` (0..1) draws a line on.
- Squash/anticipation through `spring()`: landings, startles, pops.
- Camera: never still. Every shot has `cam(t)` that pushes or trucks (1.0 → 1.06 wide, 1.2 → 1.4 medium, 1.5 → 1.85 close).
- Cuts: hard cut under a **scribble wipe** (a fat marker zig-zag sweeps across and off, 0.44 s).

## Shot grammar
Wide (walk, orientation) → medium (event) → close (feeling) → wide (exit). One focal point per shot; at most 3 study elements (hero, one prop, one orbiting doodle group). Background scenery is a calm wash with outline, never the loudest thing.

## Sound palette
Procedural, rights-free (`tools/score.sh`): plucked pentatonic tune (sine plucks), bass drone, whoosh (filtered pink noise) on falls, soft pop on landings, three-note chime on a pick-up, swell chord on a reveal, footsteps (noise ticks). Cues are listed in `templates/film.js`; re-time them when you re-time shots.

## Pitfalls
- A multiply fill without the paper underlay turns muddy over a coloured sky (the engine adds the underlay; keep `base: true` except for washes).
- Night must be a **solid** wash (`mult: false`), not a multiply, or it goes grey.
- Do not mix 3 or 4 hero poses with no idle motion: a character with `ph = 0` still breathes and blinks, keep it that way.
- Wide empty sky freezes: always call `motes()` or place a cloud there.
- `say()` text is queued and drawn after the camera resets; do not draw text with `ctx.fillText` in a shot.

## Native moves menu
1. Line draws itself on (`p`) · 2. spark falls with a scribbled comet tail · 3. startle: hop + wide eyes + "o" mouth + a word plate pops · 4. rays staggered out of an object · 5. doodles orbit the hero (heart, note, swirl) · 6. scribble wipe cut · 7. dusk turn (sky → night, glow lights the path) · 8. cat reacts a beat late · 9. title typed on a plate · 10. arrow that curls and arrives.

## Variation space
Hero tint (`tint`), skin, scarf; palette swap sky/lilac/night for a morning or a storm; replace Pip's props with your own via `hold`; two-character scenes with `face: -1`; a notebook-ruled paper (draw `scribble` rules in a wash); a chalk-on-slate variant (`PAL.paper` dark, `PAL.ink` white).

## Kit details that are easy to miss
- `data-duration` in `index.html` must equal `DUR` in `film.js`; shots tile `0..DUR` with no gap (the console warns).
- Everything is a pure function of `TT`: use `hash`/`nz` for randomness, never `Math.random`, `Date`, `performance.now`.
- Run `sh tools/deadhold.sh out.mp4` on the render (see `RENDER.md`); the paper boil alone does not excuse a frozen element: if a hit appears, drift the camera or build something there.
- World ground is `groundY(x)` (y ≈ 830); put feet at `groundY(x) + 10`, tufts/flowers below it.
- The audio `<audio>` tag points to `audio/score.wav`; delete the tag for a silent film, or rerun `tools/score.sh` after editing notes.
- Frame size comes from the canvas size (`engine/runtime.js` reads it), so the same engine, sets and Pip serve 1920×1080 and 1080×1920.

## Vertical 9:16 (Shorts, Reels, TikTok)
A vertical Short is its own film composed for the tall frame (`templates/vertical.html` + `templates/film-v.js`), never the 16:9 film scaled or letterboxed. Size 1080×1920 is set in three places: html/body CSS, `data-width`/`data-height` on the root, and the canvas attributes.

**Safe area (same in every kit):** Shorts/Reels/TikTok cover the top 250 px, the bottom 450 px and the right 140 px with UI. All text, captions, numbers and faces stay inside x 90-940, y 250-1470; centred captions at most 800 px wide (x 140-940). Background art, sky, ground and motion still fill the full frame edge to edge. Text ≥ 44 px (the kit uses 100-130), max about 4 words per line.

**Framing (same in every kit, 2026-10-19):** the main subject (the character as seen in the shot: full body, knees-up or close-up; or the one key object) spans at least 60% of the frame height (>= 1150 px, measure it on the stills). Feet and lower body may run under the bottom UI band; only text and faces must stay in the safe area. One character per shot by default; a two-shot or split screen only as a short cut-in (<= 1.5 s). Frame 0 is mid-action: something is already moving in the first frame, never a standing establishing shot. Where a number below gives a smaller subject, move the camera closer.

**Layout rules**
- **Camera:** feet line `FEET = 1850` (feet in the bottom UI band), zoom 3.4-3.6 for the walk, 3.5-3.8 medium (a slight tilt, `cam` fourth value, -0.04 → 0.02 rad), 3.9-4.2 close-up: Pip (357 px at s 1) spans at least 1150 px. Zoom 2.8 or less makes him under 55% of the frame (the old numbers here did; measured 2026-10-21). Use `camY(groundWorldY, zoom, feetScreenY)` for wide/medium; the close-up sets the camera y straight on the head. Vary the framing per shot (wide walk, tilted medium, big close-up): neighbouring shots never share a layout.
- **Subject:** Pip stands at screen x 450-650 in wide/medium shots and about 330 in the close-up (face inside x 90-940); the raised spark lands at x ≤ 900 and the rays (`rays(…, 50, 80, …)` clipped to the upper/right side) and glow stay left of x ≈ 940, never crossing the face. The cat does not fit next to a full-size Pip in the tall frame: give Dot her own shot (or a stacked panel), never a squeezed two-shot; side props never touch the right edge.
- **Height is the event axis:** the spark falls the whole frame (`tail` 330), a column of doodles (heart, plus-sparkle, swirl; no tall stems or poles) rises a short way out of the spark (loop `v = u % 1`), the title sits in the sky above Pip, captions in the sky above Pip's head (y ≈ 300-520), never over his torso or face. Wipes zig-zag top to bottom with a thinner marker (w 150, 9 turns) so scenery shows between the strokes instead of a flat purple screen.
- **Sets:** `sceneryV(dusk, p, sunP, trees)` stacks clouds in tiers, passes a per-shot tree list (keep trees off Pip's head; a tree edge may bleed off the frame), a sun that rides the camera at screen x ≈ 680 (left of the right UI strip; draw it before the clouds and trees), twinkles in the dusk sky, `motes()` over 20-820 world y. The ground stays under about 28% of the frame: a narrow dirt path (solid `paperD`, `mult: false`), tuft rows, and big foreground flowers (scale 3) on tall swaying stems that fill the lowest band.
- **Type:** titles 112 px, captions 100-130 px (never below 56 px), `maxW` 560-640 so they wrap to two lines; plates stay x 90-940, y 250-1470.

**Pitfalls**
- Plates drawn in the bottom 450 px or the right 140 px are covered by the app UI.
- A 16:9 camera (zoom 1.0-1.4) in the tall frame shows a flat green band and a tiny hero: re-zoom and re-stage.
- Trees directly behind Pip's head hurt the read; one focal point only, keep set colours calmer than Pip.
- A cat or prop placed at Pip's x hides his body; offset it by 250 world px. A sun drawn after the clouds multiplies dark: draw it first.
- Keep every band moving: motes in the sky, tuft sway in the foreground, camera drift in every shot; run the freezedetect step.

## Vertical pitfalls (machine-checked, 2026-10-21)
Six built Shorts scored 10-15/20 with a strict editor; these were the repeat defects. The kit now prevents most of them; `tools/vcheck.sh out.mp4` finds the rest with exact times. Run it before you deliver and fix every line it prints.
- **Hero too small / empty bands:** the old vertical numbers gave a 30-58% hero. Keep the template's camera numbers; `track('hero')` + `track('face')` (built into the kit character; call them in any character you draw) let the layout check measure him (>= 60% of the frame, or >= 60% of its panel: `track('panel', ...)` on each stacked panel).
- **Labels over faces, bodies, raised hands:** in vertical the label helper ignores your y and lands above the tracked hero's head, inside x 108-918 (the right edge holds the like/comment buttons), at least 64 px, complete from its first frame (no typing in). Raise his head top to y >= 520 so the label has room.
- **Same picture three seconds running (10-24, the proven rival format):** a contact sheet shows 1 frame per second; ambient motion (scraps, clouds, breathing) and a moving limb in the same framing do not count. Cut to a new picture at least every 2 s: a new framing or angle, or a big visible result (`keys(t0, 2.0, [shotA, shotB])` per beat, each shot its own camera). vcheck flags 3 neighbouring 1-s frames with blurred SSIM >= 0.75.
- **End card on an empty screen or held still:** `endCard(DUR - 2, DUR)` dims the payoff shot (keep it running to DUR, so the result stays behind and moving) and puts two centred lines over it.
- **Edges:** key props and faces at least 65 px inside the frame; only sky, ground and feet bleed off. Mark the beat's key object with `track('key', ...)`: it must also be >= 20% of the frame height (a thin lever or rope does not read on a phone: draw it thick, or cut in close).
- **Transitions seen as glitches:** a wipe frame that lands on a whole second is a full-frame empty tile on the contact sheet. Shorts cut hard on the beat; any wipe stays under 0.3 s.
- **Weak hook:** frame 0 must already move (vcheck compares 0 s with 0.5 s); open mid-fall, mid-throw, mid-push, never on a title.
- Kit lessons from real builds: `LESSONS.md` (newest last).
