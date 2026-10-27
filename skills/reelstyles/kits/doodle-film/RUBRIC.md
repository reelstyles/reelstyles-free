# Doodle film: QA rubric

Score each item 0-2 (0 fails, 1 partly, 2 fully) from a contact sheet (`ffmpeg -i out.mp4 -vf "fps=1/1.25,scale=480:-1,tile=4x2" -frames:v 1 sheet.jpg`) plus a still from the middle of every shot. Total /20. **Ship at ≥ 15 with no 0.** Fix the three worst first.

1. **Hand-drawn feel:** boiling double-pen outlines, marker fills that miss the line, paper grain; no clean vector edge, no gradient on a character.
2. **No dead holds:** `sh tools/deadhold.sh out.mp4` prints OK; nothing visible is static > 1.2 s (camera drift, idle breathing, boil, staggered builds).
3. **Text size and fit:** all on-screen text (titles, captions, labels, footnotes) ≥ 28 px at 1080p (the kit bakes in 34 px) and never clipped by a plate, mask or the frame; built only with `say()`; ≤ 5 words per plate; every fact true.
4. **One focal point per shot,** max 3 study elements; the eye lands on the hero or the magic object first.
5. **Story:** a beginning, a surprise, a change, an exit; each shot has one event and the cut hides on a scribble wipe or a finished pose.
6. **Acting:** anticipation → action → settle on every beat; eyes look at what matters; the cat reacts a beat late.
7. **Framing varies:** wide / medium / close / wide; neighbouring shots never share a layout; camera moves in every shot.
8. **Colour meaning:** mustard + glow only on the magic object and what it lights; only `PAL` colours; night is solid navy not grey.
9. **Score:** sound matches the beats (fall, landing, pick-up, reveal, steps); a tune under it; no clipping. (A silent film scores 2 here if it is intentional.)
10. **Clean frames:** no blank/black frame, no figure cut by the edge, no shot gap, length matches the brief (±1 s), no overlap of text on a face.

Write down: `{ "scores": [10 ints], "total", "worst": [3 shots with what fails] }`.

## Vertical 9:16 checks (add to the score when the film is 1080 × 1920)
- Composed for vertical: the whole frame is used (sky stacked, set and ground fill edge to edge); no letterbox, pillarbox, scaled-16:9 look, or flat empty band at top or bottom.
- Nothing important in the UI zones: all text, numbers and faces inside x 90-940, y 250-1470 (top 250, bottom 450, right 140 px are covered by the app).
- Text ≥ 44 px at 1080 wide, max about 4 words per line, plates ≤ 800 px wide.
- Subject reads at phone size (Pip ≥ 500 px tall) and there is one focal point per shot.
- `ffprobe` reports 1080×1920 and `sh tools/deadhold.sh out.mp4` prints OK.
