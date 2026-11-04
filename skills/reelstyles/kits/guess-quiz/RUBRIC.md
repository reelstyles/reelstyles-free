# Countdown guessing quiz: QA rubric

Score each item 0-2 from a contact sheet (one frame per 2 s) plus one still per round and title card. Total /20. **Ship at >= 15 with no 0.** Then act as a motion director paid to find faults: start from REJECT and fix the three worst items.

1. **Round structure:** every round = item in, 3 s ring with a tick per second, zero → colour wipe + name pop + score tick.
2. **Difficulty bands:** four bands, each with its own stage colours and a full-screen title card (word + stars).
3. **No dead holds:** every shot moves continuously (breathing item, waving flag, drifting stage, camera push); no visible element static > 1.2 s; `freezedetect` (RENDER.md step 4) prints nothing.
4. **One focal point per shot:** the item; max 3 study elements (item, ring, score bar).
5. **Silhouette readability:** the shadow is guessable at phone size for easy/medium and fair for hard/impossible; the reveal colours match the answer name.
6. **Text:** every on-screen text >= 28 px at 1080p (round number, labels, score, prompt, answer), chunky Inter 900 white with soft shadow, drawn via `text()` so it is fitted and never clipped by a pill/ring or the frame edge.
7. **Ring timer:** drains smoothly, number and pulse change each second, last second warns (red + shake), ends in a check.
8. **Payoff polish:** spring on the name, confetti, flash, score fill with shine; eased, never linear except the ring.
9. **Palette and type:** bright gradient stage, white text with soft drop shadow, no third colour family per band, no clutter.
10. **Clean frames and brief:** only drawn items (no logos, product shots, real people, channel assets), nothing cut by the frame edge, safe zones respected in 9:16, length matches the brief (±1 s), size 1920x1080 or 1080x1920.

Text guards baked into the kit (list for the checker): `text()` min 30 px + wrap + shrink-to-fit + clamp inside the frame (`engine/runtime.js`); the HUD labels use fixed `maxW` equal to their pill inner width; the answer scales with the spring but fits `maxW` first.

Write down: `{ "scores": [10 ints], "total", "worst": [3 beats with timestamp and what fails] }`.
