# Dark Keynote: QA rubric

Score each 0-2 from a contact sheet (a frame every 2 s) plus a snapshot at the end of each shot. Total /20. **Ship at >= 15 with no 0**, and only after `node tools/holdcheck.mjs out.mp4` prints ok. Then act as a motion director paid to find faults and fix the 3 worst items.

1. **Cold open**: something alive in frame 0 (caret, number), no title card.
2. **No dead holds**: `holdcheck` clean; every shot has camera motion + breathing; nothing lit static > 1.2 s.
3. **Text size and clipping (baked in)**: every on-screen string >= 28 px at 1080p (captions, labels, footnotes, badges), nothing clipped by a plate, pill or the frame. `DK.audit()` and `DK.toast` fit-to-box guarantee it; do not override font sizes below 28.
4. **One focal point per shot**, max 3 study elements (focal, one label, the toast).
5. **One accent**: the accent marks only the product/action/number unit; the problem colour disappears after the turn.
6. **Grid and beat**: moves land on the beat, flights curve, items snap to a grid with no half-slots or holes.
7. **Easing**: fast-out with one small overshoot; no linear motion except scrubs; no floaty drift on UI.
8. **Transitions**: UI expand/collapse (dot, tile row, pill), no fades between shots, no blank frames.
9. **Hierarchy and type**: giant number alone on its shot, headlines one line, Inter + JetBrains Mono only.
10. **Ending and length**: one resolved final image (wordmark, tag, single caret), length matches the brief (+-1 s).

Write down `{ "scores": [10 ints], "total", "worst": [3 items with timestamp] }`.
