# Pop comic panels: QA rubric

Score 0-2 per item from a contact sheet (`fps=2`) plus one snapshot per panel. Total /20. **Ship at >= 15 with no 0.** Then act as a motion director paid to find faults: start from REJECT and fix the 3 worst.

1. **Cold open:** the page is on screen at t = 0 with art in it (no black, no intro), first caption readable within 2 s.
2. **Print look:** consistent dot screens (same pitch everywhere), visible slight misregistration, thick ink outlines, newsprint grain.
3. **Palette:** only cyan/magenta/yellow/black overprints on newsprint; no gradients, no stray hex colours.
4. **Camera:** pushes into each panel until it fills the screen, breaks the border into the next; moves 0.3-0.6 s, eased.
5. **No dead holds:** every shot moves continuously (drift, breathing, boil, stagger); `freezedetect` prints nothing (`RENDER.md` section 4).
6. **Text minimum:** all on-screen text >= 28 px at 1080p (captions, balloons, sfx, footnotes). Set by `MIN_TEXT` in `comic.js`; templates use `fitText`/`balloon`/`caption` which enforce it.
7. **Text never clipped:** balloons/captions are clamped to `K.safe`, sfx fit inside their burst; no word touches a panel border or the screen edge.
8. **One focal point:** per shot one focus (balloon or burst or character), at most 3 study elements.
9. **Lettering and balloons:** crisp balloons with tails, pop-in with overshoot, captions in yellow boxes, sfx bursts with outline + extrusion.
10. **Ending and length:** punchy page turn to an end card, length matches the brief (+/- 1 s).

Write down: `{ "scores": [10 ints], "total", "worst": [3 items with timestamp and what fails] }`.

Baked-in guards (list for QA): minimum text size 28 px (`MIN_TEXT`), fit-to-box wrapping (`fitText`), safe-area clamp (`K.safe`), per-panel clipping only for art, never for text boxes.
