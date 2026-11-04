# Kinetic type: render steps

## 0. Requirements (once)
Node.js ≥ 22 and ffmpeg on the PATH. HyperFrames runs through `npx`, pinned: `npx -y hyperframes@0.8.96 <command>` (`doctor` checks the machine). Internet on first run (npm package, Chrome, gsap from jsDelivr); nothing is uploaded.

## 1. Set up
Work in a copy of the kit. The project root is the folder that holds `engine/` and `fonts/`:
```sh
cp templates/index.html templates/film.js .
```
Edit `film.js`. If the length changes, update `DUR` in `film.js` and `data-duration` on `#root` in `index.html` (equal). Register shots with `shot(t0, t1, draw, cam, theme)` so they tile 0..DUR; register wipes with `wipeTo(cutTime, dur, colA, colB)`.

## 2. Look before you render
```sh
npx -y hyperframes@0.8.96 lint .                                    # 0 errors
npx -y hyperframes@0.8.96 snapshot . --at 0.5,1.5,3,5,7.5,9.5 --no-end -o snapshots
```
Open the PNGs / contact sheet and score against `RUBRIC.md`. At least 2 still rounds (blocking → polish).

## 3. Render
```sh
npx -y hyperframes@0.8.96 render . -o out.mp4 --quality looks --workers 2
ffprobe -v error -show_entries format=duration -of csv=p=0 out.mp4
ffmpeg -loglevel error -y -i out.mp4 -vf "fps=1/2,scale=480:-1,tile=4x3" -frames:v 1 sheet.jpg
```
1920×1080 (16:9) or 1080×1920 (vertical), 30 fps. About 3 s of wall time per film second with 2 workers (use `--quality draft` for motion checks).

## 4. Dead-hold check (mandatory before delivering)
```sh
node tools/dead-holds.mjs out.mp4
```
It flags any text-sized region that does not move for more than 1.2 s. **Fix every hit** (camera push, idle bob, staggered build, moving accent) and re-render until it prints `OK`. Then check `RUBRIC.md` item 3: all on-screen text ≥ 28 px at 1080p and nothing clipped.

## Vertical film (1080x1920, Shorts / Reels / TikTok)
Compose a separate 9:16 film; do not re-render the 16:9 one. In a copy of the kit:
```sh
cp templates/vertical.html index.html
cp templates/film-v.js film.js
npx -y hyperframes@0.8.96 lint .                                    # 0 errors
npx -y hyperframes@0.8.96 snapshot . --at 0.9,3.3,4.4,6.3,8.4 --no-end -o snapshots   # look at every PNG
npx -y hyperframes@0.8.96 render . -o out.mp4 --quality looks --workers 2
ffprobe -v error -show_entries stream=width,height -of csv=p=0 out.mp4   # must print 1080,1920
ffmpeg -v info -i out.mp4 -vf freezedetect=n=-60dB:d=1 -f null - 2>&1 | grep freeze_start   # must print nothing
node tools/dead-holds.mjs out.mp4                                    # must print OK
```
Keep text inside x 90-940, y 250-1470 (see STYLE.md, Vertical 9:16). If the length changes, update `DUR` in `film.js` and `data-duration` in `index.html`; the size lives in three places (CSS, `data-width`/`data-height`, canvas attributes) plus `window.FRAME_W/FRAME_H`.

## 5. Sound (optional; silent is valid)
Voice: Kokoro through HyperFrames (`npx -y hyperframes@0.8.96 tts script.txt -o audio/voice.wav -v am_michael`, needs `HYPERFRAMES_PYTHON` pointing at a Python with `kokoro-onnx soundfile`) or your own licensed voice. Cue shots to the word timestamps (`transcribe --json`).
Procedural hits with ffmpeg only:
```sh
mkdir -p audio
ffmpeg -y -f lavfi -i "sine=f=60:d=0.25" -af "afade=t=out:st=0:d=0.25,volume=2" audio/hit.wav        # slam / drop
ffmpeg -y -f lavfi -i "anoisesrc=d=0.4:c=pink:a=0.4" -af "highpass=f=1200,afade=t=in:d=0.15,afade=t=out:st=0.15:d=0.25" audio/whoosh.wav   # wipe
ffmpeg -y -f lavfi -i "sine=f=1760:d=0.3" -af "afade=t=out:st=0:d=0.3,volume=0.4" audio/bell.wav     # logo dot
```
Place them at the shot times with `adelay`, mix to one `audio/mix.wav` (`amix`, `loudnorm=I=-16`), then add inside `#root`:
```html
<audio id="mix" class="clip" data-start="0" data-duration="11" data-track-index="0" src="audio/mix.wav" data-volume="1"></audio>
```

## Troubleshooting
- Blank frames: a JS error; `npx -y hyperframes@0.8.96 validate .`.
- Frames differ between renders: something uses `Math.random`/`Date`.
- Wrong font: keep `fonts/` next to `index.html`.
- Out of memory: `--workers 1`.
