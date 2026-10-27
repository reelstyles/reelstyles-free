# Dark Keynote: render steps

Needs Node >= 22 and ffmpeg. Chrome is fetched by HyperFrames on first use; gsap loads from jsDelivr (internet on first run).

1. Project root = the kit folder (or a copy). `cp templates/index.html .` and edit the film script at the bottom of it (shots, `TOTAL`, `data-duration`).
2. Lint: `npx -y hyperframes@0.8.96 lint .` must report 0 errors.
3. Stills first (2-3 rounds): `nice -n 19 npx -y hyperframes@0.8.96 snapshot . --at 0.5,3,5,7,9 --no-end -o snapshots` and open the PNGs and `contact-sheet.jpg`. Check against `RUBRIC.md`.
4. Render: `nice -n 19 npx -y hyperframes@0.8.96 render . -o out.mp4 --quality looks --workers 2` (about 8 s of wall time per film second; `--quality draft` for a motion check).
5. **Dead-hold check, mandatory before delivering:** `node tools/holdcheck.mjs out.mp4` (limit 1.2 s). Every hit is a lit region that did not move; add camera drift, `DK.alive` breathing or a staggered build there, re-render, repeat until it prints `holdcheck: ok`.
6. Contact sheet: `ffmpeg -y -i out.mp4 -vf "fps=1/2,scale=480:-1,tile=4x3" -frames:v 1 sheet.jpg` and score it with `RUBRIC.md`.

## Sound (optional)
Kokoro TTS: `npx -y hyperframes@0.8.96 tts script.txt -o audio/voice.wav -v am_michael` then add `<audio class="clip" data-start="0" data-duration="TOTAL" data-track-index="0" src="audio/voice.wav"></audio>` inside `#dk-stage`. Foley with ffmpeg: a click = `ffmpeg -f lavfi -i "sine=f=1800:d=0.03" -af afade=out:st=0:d=0.03 tick.wav`; the press drop = `sine=f=140:d=0.25` with a fade; mix under the voice at -14 dB.

## Troubleshooting
Blank frames: `npx -y hyperframes@0.8.96 validate .` prints the JS error. Jitter between renders: something uses `Math.random`/`Date`; use `DK.rng(seed)`. Wrong font: keep `fonts/` next to `index.html`.
