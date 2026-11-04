# Countdown guessing quiz: render steps

## 0. Requirements
Node.js >= 22 and ffmpeg on the PATH. Chrome is fetched by HyperFrames on first use. Pinned: `npx -y hyperframes@0.8.96 <command>`. Internet is needed on first run (npm, Chrome, gsap from jsDelivr).

## 1. Set up
Work in a copy of the kit folder. Copy **one** root html (HyperFrames refuses two) and the film script:
```sh
cp templates/index.html .       # 16:9, 1920 x 1080          -or-   cp templates/vertical.html index.html   # 9:16, 1080 x 1920
cp templates/film.js .
```
Edit `film.js` (the `PLAN` list: band, item, prompt). Keep `data-duration` in the html = sum of the `beat()` lengths = `mountFilm(total)` (each band = 1.3 + 5.1 s).

## 2. Look before you render
```sh
npx -y hyperframes@0.8.96 lint .          # must be 0 errors
npx -y hyperframes@0.8.96 snapshot . --at 0.8,2.2,4.4,5.8,10.5,17.5,24.6 --no-end -o snaps
```
Open `snaps/contact-sheet.jpg` and the PNGs, check against `RUBRIC.md`, at least two rounds. (`--describe: GEMINI_API_KEY not set` is harmless.)

## 3. Render
```sh
npx -y hyperframes@0.8.96 render . -o out.mp4 --quality looks --workers 2
ffprobe -v error -show_entries stream=width,height -show_entries format=duration -of csv=p=0 out.mp4
ffmpeg -loglevel error -y -i out.mp4 -vf "fps=1/2,scale=270:-1,tile=7x2" -frames:v 1 sheet.jpg
```
About 2-3 s of wall time per film second on 2 workers; `--quality draft` for motion checks.

## 4. Dead-hold check (mandatory before delivering)
```sh
ffmpeg -hide_banner -i out.mp4 -vf freezedetect=n=-60dB:d=0.4 -f null - 2>&1 | grep -a freeze_
```
**Run this and fix every hit before delivering.** A hit means nothing visible moved for 0.4 s: re-enable or add an idle layer (breathing, sway, bubbles, camera push) in that beat, re-render, run again until it prints nothing. Also confirm no text is clipped and every text is >= 28 px at 1080p (`text()` guarantees it; never bypass it).

## 5. Sound (optional; silent is valid)
All procedural with ffmpeg; nothing to license. One-shots:
```sh
mkdir -p audio
ffmpeg -y -f lavfi -i "anoisesrc=d=0.04:c=white" -af "highpass=f=3000,afade=t=out:d=0.04,volume=0.6" audio/tick.wav
ffmpeg -y -f lavfi -i "sine=f=880:d=0.5" -f lavfi -i "sine=f=1320:d=0.5" -filter_complex "[0][1]amix=inputs=2,afade=t=out:d=0.5,volume=0.5" audio/pop.wav
ffmpeg -y -f lavfi -i "anoisesrc=d=0.5:c=pink" -af "highpass=f=500,afade=t=in:d=0.45,afade=t=out:st=0.45:d=0.05,volume=0.5" audio/whoosh.wav
ffmpeg -y -f lavfi -i "sine=f=196:d=26" -f lavfi -i "sine=f=294:d=26" -filter_complex "[0][1]amix=inputs=2,tremolo=f=2:d=0.3,lowpass=f=900,volume=0.25,afade=t=out:st=24:d=2" audio/bed.wav
```
Place ticks at each round's `start + 0.6, 1.6, 2.6 s`, whoosh at `+3.2`, pop at `+3.72` (round start = band index x 6.4 + 1.3), mix with `adelay` and `amix`, then add inside the root element:
```html
<audio id="mix" class="clip" data-start="0" data-duration="25.6" data-track-index="0" src="audio/mix.wav" data-volume="1"></audio>
```

## Troubleshooting
- Blank frames: a JS error. `npx -y hyperframes@0.8.96 validate .`
- Wrong font in stills: keep `fonts/` next to `index.html`.
- Jitter between renders: something uses `Math.random`/`Date`; every frame must be a pure function of t.
- Out of memory: `--workers 1`.
