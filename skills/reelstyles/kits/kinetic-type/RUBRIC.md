# Kinetic type: QA rubric

Score each item 0-2 from a contact sheet (`ffmpeg -i out.mp4 -vf "fps=1/2,scale=480:-1,tile=4x4" -frames:v 1 sheet.jpg`) plus a still in the middle of every shot. Total /20. **Ship at ≥ 15 with no 0.** Fix the three worst first.

1. **Change:** something visibly changes between consecutive sheet frames; no frozen stretch.
2. **No dead holds (motionmaxxing):** `node tools/dead-holds.mjs out.mp4` prints OK; every shot has camera push + idle motion; no visible element static > 1.2 s.
3. **Text size and fit:** all on-screen text (titles, eyebrows, captions, labels, footnotes) ≥ 28 px at 1080p, never clipped by a mask/plate or the frame edge, no console warnings from `word()`/`small()`. The engine clamps and fits; do not bypass it with raw `fillText`.
4. **One focal point:** one word or stack per shot, max 3 study elements (word + eyebrow + furniture); hierarchy is obvious at a glance.
5. **Words are the actors:** every beat's entrance matches the word's meaning (slam for loud, rise for build, drop for weight); not just fades.
6. **Easing:** entrances ease out / spring, wipes ease in-out, nothing linear except the progress hairline; letters stagger rather than appear as a block.
7. **Palette:** only `PAL` colours; accent amber used sparingly; text contrast on every field ≥ 4.5:1.
8. **Readable at phone size:** hero words ≥ 150 px, ≤ 6 words per shot, one word per ticker beat of ≥ 0.5 s.
9. **Transitions in the medium:** hard cuts on the beat or the slanted wipe; no fades, dissolves or 3D flips; the cut hides under full coverage.
10. **Ending and clean frames:** logo reveal lands and holds ≥ 1.2 s with idle motion; no black/empty frames, no shot gap, the length matches the brief (±1 s).

Write down: `{ "scores": [10 ints], "total", "worst": [3 shots with what fails] }`.

## Vertical 9:16 checks (for films made from `templates/vertical.html`)
Also score these; any miss counts against items 3, 4, 8 and 10:
- ffprobe says 1080x1920; the full frame is composed for vertical (stacked lines, closer framing, camera that uses the height).
- No letterbox, pillarbox or scaled-16:9 look; no empty or flat band at the top or bottom (stage, ghost words and blobs fill the frame).
- Nothing important in the UI zones: top 250 px, bottom 450 px, right 140 px. Text and faces inside x 90-940, y 250-1470.
- All text >= 44 px at 1080 wide, max about 4 words per line, nothing clipped.
- The subject reads at phone size; one focal point per shot; `freezedetect` and `tools/dead-holds.mjs` are clean.
