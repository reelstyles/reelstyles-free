# Kinetic type: style guide

## Essence
Words are the actors. Every beat is one huge word (or one stacked phrase) that enters with attitude, lands, and keeps living: letters bob, lines drift against each other, the camera pushes in, colour blobs swim behind. Hard cuts on the beat, slanted colour wipes between sections, a bracketed logo reveal at the end. Confident, loud, clean, never cluttered.

## What it is not
Not a caption/subtitle style (words are the picture, not a layer on one). Not 3D text, not neon, not handwritten. No icons, photos or characters; at most one thin furniture element (brackets, rule, dot) per shot.

## Materials
Flat ink stage (`#0C0B16`) with three big blurred colour blobs drifting on slow sines, a faint dot grid sliding diagonally, a soft vignette. Letters are solid fills with a hard offset shadow or a ring of outline echoes. Colour-field shots (flat mint, pink, amber, violet) for ticker beats.

## Palette (`PAL` in `engine/kinetic.js`; use nothing else)
ink `#0C0B16` · ink2 `#171428` · cream `#F6F1E7` (default text) · violet `#8B5CFF` · pink `#FF4FA3` · mint `#2EE6C5` · amber `#FFB534` (the one accent: eyebrows, logo dot, progress hairline) · blue `#4C7DFF` · coral `#FF6B4A`.
Text colour on a colour field: ink on mint/amber, cream on pink/violet. Never violet text on a violet field.

## Type
Display: Archivo Black (OFL), squeezed to 82% width (`cond: 0.82`) for poster stacks and ticker words; full width for single titles and the logo word. Small text: Inter 800, capitals, tracked +0.22 em. **Minimum 28 px everywhere** (the engine clamps to 28 for words and 30 for captions); keep eyebrows 34-40 px. Max 6 words per shot; one word per ticker beat.

## Motion grammar
- Entrances (per letter, staggered 25-70 ms): `drop` (spring landing, with camera shake), `rise` (out of a mask line), `slam` (from 3.4x scale, ticker), `spin` (logo), `pop`, `fade`.
- After landing the word never freezes: idle bob (~1.2% of size), idle scale breath, horizontal drift (`drift`, ±14 px × factor, alternating per line in a stack), plus a camera push of 5-8% per shot.
- Easing: `EZ.o5` for entrances, `spring` for weight, `EZ.io` for wipes. Never linear except the progress hairline and the ground-truth clock.
- Cuts: hard on the beat for ticker words; `wipeTo(tc, dur, colA, colB)` (slanted double band, the cut is hidden at full coverage) between sections. No fades, no dissolves.
- Impact: `shake(t, t0, amp)` added to the camera when something lands.

## Shot grammar
One focal point per shot (a word, a stack, or a slot window). At most 3 study elements: word + eyebrow + furniture. Rhythm 2.0 s title/stack beats, 0.6 s ticker beats, 2.0-2.4 s logo. Sequence that works: title slam → stack → ticker → swap → logo.

## Sound palette
Silent is valid. If you add sound: a low sub-hit on every slam/drop (60 Hz sine, 120 ms, fast decay), a short noise swoosh under each wipe, a tick per ticker word, a bell/pluck on the logo dot. Recipes in `RENDER.md`.

## Pitfalls
- A held word with no camera push or idle looks dead: keep `pushCam` on every shot.
- Echo rings wider than the frame: keep `echo` scale ≤ 1.15 on words wider than 1500 px.
- Long words: `word()` shrinks to `maxW` (frame − 160 px) and warns in the console when it cannot fit; split the line instead.
- `mask: true` clips to a band around the line; do not stack other text inside that band.
- Do not use `Math.random` or `Date`; use `mulberry32(seed)`.

## Native moves menu
Title slam with outline echoes · poster stack with alternating drift · one-word-per-beat colour-field ticker · slot-machine swap (static lead-in + rolling word that lands) · letters assembling into a wordmark with a bracket + glint line · number slam (a big digit with the unit in a small word) · word-shake on impact · word exits upward (`out: [t, dur]`).

## Variation space
Swap the palette (keep contrast ≥ 4.5:1 for text), the display weight (condensed `cond` 0.7-1.0), the wipe angle (`slant`), the stage (flat colour, no blobs), the logo word. Add your brand name and tagline in shot 5.

## Vertical 9:16 (Shorts, Reels, TikTok)
A vertical Short is its own film composed for 1080x1920, never the 16:9 film scaled or letterboxed. Start from `templates/vertical.html` + `templates/film-v.js` (the HTML sets `window.FRAME_W = 1080; window.FRAME_H = 1920` before `engine/runtime.js`, so `W`/`H` become 1080/1920 and the stage fills the whole tall frame).
- **Safe area (same in every kit):** Shorts/Reels/TikTok cover the top 250 px, the bottom 450 px and the right 140 px with UI. All text, captions, numbers stay inside x 90-940, y 250-1470; centred captions at most 800 px wide (x 140-940). The sample centres text on x 515 and limits words to 780 px (stack lines 720 px) so drift and the camera push cannot cross x 940. Stage, blobs, wipes and ghost words still fill the full frame edge to edge.
- **Framing (same in every kit, 2026-10-19):** the main subject (the character as seen in the shot: full body, knees-up or close-up; or the one key object) spans at least 60% of the frame height (>= 1150 px, measure it on the stills). Feet and lower body may run under the bottom UI band; only text and faces must stay in the safe area. One character per shot by default; a two-shot or split screen only as a short cut-in (<= 1.5 s). Frame 0 is mid-action: something is already moving in the first frame, never a standing establishing shot. Where a number below gives a smaller subject, move the camera closer.
- **Stack, don't spread:** use the height. Title = two huge lines one above the other; poster stack = 5 lines at about 270 px (pitch 0.86) centred on y 860; ticker beat = a lead word (about 400 px) over a huge word (about 500 px) in a colour field; slot swap = static line above, rolling window in the middle (about 380 px tall), a payoff line below; logo = eyebrow, wordmark, light line, two-line tagline inside tall brackets (860 x 840).
- **Type sizes:** hero words 270-520 px (the engine fits them to `maxW`, so pass `maxW: 780`), eyebrows and captions 44-48 px (never below 44 at 1080 wide), max about 4 words per line.
- **Camera:** push 3-6% per shot with a vertical drift of 40-60 px (`pushCam(t0, t1, 1, 1.04, -20, 40)`); keep zoom at or below 1.06 on full-width lines. Impact shake as in 16:9.
- **Ghost word:** on ticker beats an outline copy of the word, scaled 2.6-2.9x, bleeds across the full frame behind the solid word (alpha 0.25) so the colour field is never a flat band.
- **Wipes:** `wipeTo(tc, dur, colA, colB, true, 220)` rises from the bottom edge to the top; the cut hides under full coverage.
- **Pitfalls:** text drifting past x 940 (right UI strip); anything meaningful below y 1470 or above y 250; a single word on a colour field at 16:9 size (looks tiny, stack two lines instead); full-width lines with zoom above 1.06; huge empty gradient bands: keep blob radii 700-1000 px and the ghost word.

- **Never leave a frame empty (judges sample fixed seconds):** every shot must show text or a ghost word from its first frame (set the first word's `t0` at or before the shot start, ticker beats `t0: a - 0.05`), keep a colour-field shot at 0.5 s or more with a ghost word, and keep wipes at 0.4-0.5 s (full coverage lasts one frame). Never put a flat colour shot with no type anywhere in the film.
- **Fill the height:** centre the main stack on y 860 (the optical centre of the safe box) and give every shot 3+ elements spread from y 400 to y 1350 (lead word, hero word, payoff line / ghost word / bracket). Anything alone in the middle (a cursor block, a hairline) is dead space: remove it or pair it with type.
- **Engine safety nets (9:16 only):** `word()` clamps to the safe box and 780 px, `small()` is at least 48 px and clamped. Do not fight them; pass `free: true` only for scaled ghost/outline decor. Keep the logo lock-up and tagline above y 1400.

## Kit details that are easy to miss
- `data-duration` in `index.html` must equal `DUR` in `film.js`; shots must tile 0..DUR with no gap (the engine warns in the console).
- The wipe must be registered with `trans()` at the cut time of the shots it joins (`wipeTo` does it).
- Run `node tools/dead-holds.mjs out.mp4` on every render and fix every hit before delivering (it reads 16:9 and 9:16 sizes).
- Text minimums and fit-to-box are baked into `word()`/`small()`; do not draw text with raw `ctx.fillText` in a film.
- Fonts load before the first frame; keep `fonts/` next to `index.html`.
