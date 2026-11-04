# Stick metaphor Short: render steps

## 0. Requirements
Node.js >= 22 and ffmpeg on the PATH. Chrome is fetched by HyperFrames on first use. Everything is pinned: `npx -y hyperframes@0.8.96 <command>`. Internet is needed on first run (npm, Chrome, gsap from jsDelivr).

## 1. Set up
Work in a copy of the kit folder. Copy **one** root file and the film script (HyperFrames refuses two root html files):
```sh
cp templates/vertical.html index.html    # 9:16, 1080 x 1920 (the main format)   -or-   cp templates/index.html .  # 16:9, 1920 x 1080
cp templates/film.js .
```
Edit `film.js`: labels, beat order, camera. Keep `data-duration` in `index.html` = the sum of the `beat()` lengths = `mountFilm(total)`.

## 2. Look before you render
```sh
npx -y hyperframes@0.8.96 lint .          # must be 0 errors
npx -y hyperframes@0.8.96 snapshot . --at 1,5,9,13,17,21,25,27.8 --no-end -o snaps
```
Open `snaps/contact-sheet.jpg` and the PNGs; check them against `RUBRIC.md`; at least two rounds. Stills are cheap, renders are not. (`--describe: GEMINI_API_KEY not set` is harmless.)

## 3. Render
```sh
npx -y hyperframes@0.8.96 render . -o out.mp4 --quality looks --workers 2
ffprobe -v error -show_entries stream=width,height -show_entries format=duration -of csv=p=0 out.mp4
ffmpeg -loglevel error -y -i out.mp4 -vf "fps=1/2,scale=270:-1,tile=7x2" -frames:v 1 sheet.jpg
```
About 3 s of wall time per film second on 2 workers. Use `--quality draft` for motion checks.

## 4. Dead-hold check (mandatory before delivering)
```sh
ffmpeg -hide_banner -i out.mp4 -vf freezedetect=n=-60dB:d=0.4 -f null - 2>&1 | grep -a freeze_
```
**Run this and fix every hit before delivering.** A hit means nothing visible moved for 0.4 s or more: add a bounce, walk, scroll, build or a slower camera push to that beat, re-render, run again until it prints nothing. Also confirm no label is clipped and every on-screen text is >= 28 px at 1080p (`text()` guarantees it; do not bypass it).

## 5. Sound (optional; silent is valid)
No voice. A soft music bed and short SFX with ffmpeg only (all procedural, nothing to license):
```sh
mkdir -p audio
# music: slow two-note pad, low-passed, 28 s
ffmpeg -y -f lavfi -i "sine=f=110:d=28" -f lavfi -i "sine=f=165:d=28" -f lavfi -i "sine=f=220:d=28" \
  -filter_complex "[0][1][2]amix=inputs=3,tremolo=f=0.25:d=0.4,lowpass=f=700,volume=0.5,afade=t=in:d=1,afade=t=out:st=26:d=2" audio/music.wav
# soft thud (landing) and tick (domino) one-shots
ffmpeg -y -f lavfi -i "sine=f=70:d=0.18" -af "afade=t=out:d=0.18,volume=2" audio/thud.wav
ffmpeg -y -f lavfi -i "anoisesrc=d=0.05:c=white" -af "highpass=f=2500,afade=t=out:d=0.05,volume=0.5" audio/tick.wav
```
Place SFX at the beat landings with `adelay` (ms) in one `amix`, music about -20 LUFS, then add one clip inside the root element of `index.html`:
```html
<audio id="mix" class="clip" data-start="0" data-duration="28" data-track-index="0" src="audio/mix.wav" data-volume="1"></audio>
```

## Troubleshooting
- Blank frames: a JS error. `npx -y hyperframes@0.8.96 validate .`
- Wrong font in stills: keep `fonts/` next to `index.html`.
- Jitter between renders: something uses `Math.random`/`Date`; every frame must be a pure function of t.
- Out of memory: `--workers 1`.

## Vertical Short (9:16, 1080 x 1920) with the layout guard
```sh
cp templates/vertical.html index.html && cp templates/film-v.js film.js
npx -y hyperframes@0.8.96 lint .          # 0 errors
node tools/layout-check.mjs .             # prints nothing
npx -y hyperframes@0.8.96 render . -o out.mp4 --quality looks --workers 2
bash tools/vcheck.sh out.mp4              # must print "vcheck: pass"
ffmpeg -v error -y -i out.mp4 -vf "fps=1,scale=180:320,tile=9x4" -frames:v 1 sheet.jpg   # look at it
```
`data-duration` in vertical.html (34) must equal the sum of the beats in film-v.js.
