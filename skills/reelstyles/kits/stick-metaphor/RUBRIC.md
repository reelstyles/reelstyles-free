# Stick metaphor Short: QA rubric

Score each item 0-2 from a contact sheet (one frame per 2 s) plus one still per beat. Total /20. **Ship at >= 15 with no 0.** Then act as a motion director paid to find faults: start from REJECT and fix the three worst items.

1. **Cold open and loop:** beat one is up at t = 0 with labels; the last frame equals frame one (loop).
2. **Six to eight separate metaphors,** 3-5 s each, each a different layout; none stretched across the Short.
3. **No dead holds:** every shot has continuous motion (camera push, idle breathing, scroll, staggered builds); no visible element static > 1.2 s; `freezedetect` (RENDER.md step 4) prints nothing.
4. **One focal point per shot,** max 3 study elements, 1-3 grey props.
5. **Colour roles:** white figures on pure black, grey props, ONE accent (yellow or red) only on the point of the metaphor. No other colours.
6. **Text:** every on-screen text >= 28 px at 1080p (labels, captions, footnotes), 2-4 words, Inter, drawn via `text()` so it is fitted and never clipped by a plate or the frame edge.
7. **Figure acting:** eased snappy poses, squash on landings, anticipation before actions, never frozen.
8. **Camera:** locked or slow push only; hard cuts with the 0.28 s pop, fades <= 0.5 s.
9. **Ending:** last beat is a reversal question in text over a hold that loops into frame one.
10. **Clean frames and brief:** no empty/black beats, nothing cut by the frame edge, no real-channel characters, logos, names or fonts, length matches the brief (+-1 s), size is 1080x1920 (9:16) or 1920x1080.

Text guards baked into the kit (list for the checker): `text()` min 28 px + wrap + shrink-to-fit + x clamp (`engine/runtime.js`); labels inside props use `clampX:false` but the same min size and `maxW = prop width - 24`.

Write down: `{ "scores": [10 ints], "total", "worst": [3 beats with timestamp and what fails] }`.
