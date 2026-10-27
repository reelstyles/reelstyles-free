# Doodle film: render steps

From an empty folder to `out.mp4`. Everything runs on your machine.

## 0. Requirements (once)
Node.js ≥ 22, ffmpeg and bc on the PATH. Chrome comes with HyperFrames on first use. Pinned tool: `npx -y hyperframes@0.8.96 <command>`; check with `... doctor`. Internet is needed on first run (npm, Chrome, gsap from jsDelivr); after that renders are local.

## 1. Set up
Work in the kit folder or a copy (the root holds `engine/`, `characters/`, `sets/`, `fonts/`, `audio/`, `tools/`):
```sh
cp templates/index.html templates/film.js .
```
Edit `film.js`. If the length changes, `data-duration` (root element and the `<audio>` tag) and `DUR` must match. Shots registered with `shot(t0, t1, draw, title, cam)` must tile `0..DUR`.

## 2. Look before you render
```sh
npx -y hyperframes@0.8.96 lint .                                  # must be 0 errors
npx -y hyperframes@0.8.96 snapshot . --at 1,3.4,4.6,6.5,9 --no-end -o snapshots
```
Open the PNGs and `snapshots/contact-sheet.jpg`, check against `RUBRIC.md`, fix, repeat: at least 2 rounds. (`snapshot` has no `--workers` flag; "GEMINI_API_KEY not set" is harmless.)

## 3. Render and QA
```sh
npx -y hyperframes@0.8.96 render . -o out.mp4 --quality looks --workers 2
ffprobe -v error -show_entries format=duration -of csv=p=0 out.mp4
# REQUIRED before delivering: dead-hold check. Every hit is a frozen stretch: fix it, re-render, run it again.
sh tools/deadhold.sh out.mp4
ffmpeg -loglevel error -y -i out.mp4 -vf "fps=1/1.25,scale=480:-1,tile=4x2" -frames:v 1 sheet.jpg
```
**Run `sh tools/deadhold.sh out.mp4` and fix every hit before delivering** (it splits the frame into 12 tiles and lists any tile unchanged for ≥ 1.2 s). Fixes: `motes()` over empty sky, a cloud, a camera push in `cam()`, a staggered build, a sway. It must print `OK`. Check text: every plate ≥ 34 px and fully inside the frame (the engine enforces it; do not bypass `say()`).

About 5 s of wall time per film second at `--quality draft`, ~2-3x that at `looks`, with 2 workers. Output 1920 × 1080, 30 fps.

## Vertical film (1080 × 1920, Shorts/Reels/TikTok)
```sh
cp templates/vertical.html index.html
cp templates/film-v.js film.js
npx -y hyperframes@0.8.96 lint .                                  # must be 0 errors
npx -y hyperframes@0.8.96 snapshot . --at 0.8,2.2,3.6,4.8,6.0,7.5 --no-end -o snapshots
npx -y hyperframes@0.8.96 render . -o out.mp4 --quality looks --workers 2
ffprobe -v error -show_entries stream=width,height -of csv=p=0 out.mp4   # must print 1080,1920
sh tools/deadhold.sh out.mp4                                      # must print OK (freezedetect on 12 tiles)
bash tools/vcheck.sh out.mp4                                      # must print "vcheck: pass": holds, same-picture seconds, hook, layout (labels, hero size, edges) with times
```
Look at the PNGs (rubric "Vertical 9:16 checks") and iterate at least 2 rounds. Edit `film.js` as in step 1; `data-duration` in `index.html` (root and `<audio>`) must equal `DUR`. The sample is 8 s and reuses `audio/score.wav` (trimmed by `data-duration`).

## 4. Sound (a silent film is valid)
The kit ships a procedural score for the sample film. Re-score a new film by editing the note list and cue lines in `tools/score.sh`, then:
```sh
bash tools/score.sh            # writes audio/score.wav (mono 22 kHz, about 440 KB per 10 s), nothing is downloaded
```
Cue by hand: whoosh = `noise <start> <dur> <vol> <lowpass> <highpass>`, pluck = `add <freq> <start> <dur> <vol>`. Match them to the beats listed at the top of your `film.js`.
Voice (optional): local Kokoro through HyperFrames (`npx -y hyperframes@0.8.96 tts script.txt -o audio/voice.wav`, needs `kokoro-onnx`) or your own ElevenLabs key under your plan's terms; add a second `<audio>` clip with `data-track-index="1"`. Use only music you hold a licence for.

## Troubleshooting
- **Blank frames:** a JS error: `npx -y hyperframes@0.8.96 validate .`.
- **Frames differ between renders:** something uses `Math.random`/`Date`. Use `hash()`/`nz()`.
- **Wrong font:** keep `fonts/` next to `index.html`.
- **Render killed (memory):** `--workers 1`.
