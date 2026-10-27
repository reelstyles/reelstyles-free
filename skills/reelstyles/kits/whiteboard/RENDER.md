# Whiteboard explainer: render steps

From an empty folder to `out.mp4`. Everything runs on your machine.

## 0. Requirements (once)
Node.js ≥ 22 and ffmpeg on the PATH. Chrome is fetched by HyperFrames on first use. HyperFrames is pinned: `npx -y hyperframes@0.8.96 <command>`. Internet is needed on the first run (npm, Chrome, gsap from jsDelivr); afterwards nothing is uploaded.

## 1. Set up
Work in a copy of the kit folder (the project root holds `engine/`, `fonts/`, `tools/`):
```sh
cp templates/index.html templates/film.js .
```
Edit `film.js`. If the length changes, `DUR` in `film.js` and `data-duration` on the root element in `index.html` must be equal.

## 2. Look before you render
```sh
npx -y hyperframes@0.8.96 lint .                                        # 0 errors
npx -y hyperframes@0.8.96 snapshot . --at 1,3,5,7,9 --no-end -o snapshots
```
Open `snapshots/contact-sheet.jpg` and the PNGs; score with `RUBRIC.md`. Plan three still rounds (layout → timing/camera → polish). Test mid-stroke times, mid-whip times (blur) and the last second.

## 3. Foley (optional, recommended)
```sh
node tools/foley.mjs film.js audio/foley.wav     # strokes, magnet clacks, eraser, room tone, from the film's own schedule
```
Add inside the root element of `index.html` (duration = film length):
```html
<audio id="foley" class="clip" data-start="0" data-duration="11" data-track-index="0" src="audio/foley.wav" data-volume="1"></audio>
```
Voice: local Kokoro (`npx -y hyperframes@0.8.96 tts script.txt -o audio/voice.wav -v am_michael -s 0.95`, needs a Python venv with `kokoro-onnx soundfile` and `HYPERFRAMES_PYTHON` set) or your own ElevenLabs key (your plan's licence applies). Mix voice at about -16 LUFS with foley around 11 dB under it and music 18-22 LU under it: 
```sh
ffmpeg -i audio/voice.wav -i audio/foley.wav -filter_complex "[1]volume=0.35[f];[0][f]amix=inputs=2:duration=longest,loudnorm=I=-16:TP=-1.5" audio/mix.wav
```
Time `write()` windows to the voice with `npx -y hyperframes@0.8.96 transcribe audio/voice.wav --json` (word times): a term appears exactly when it is said.

## 4. Render
```sh
npx -y hyperframes@0.8.96 render . -o out.mp4 --quality looks --workers 2
ffprobe -v error -show_entries format=duration -of csv=p=0 out.mp4
ffmpeg -loglevel error -y -i out.mp4 -vf "fps=1/2,scale=480:-1,tile=4x3" -frames:v 1 sheet.jpg
```
**Do not end your turn (or report) while the render runs.** A film is only delivered when `out.mp4` exists and ffprobe prints its duration. Run the render in the foreground with a long timeout (up to 10 min per call); if your tool backgrounds it, poll every 30-60 s (`ls -la out.mp4; pgrep -f "hyperframes render"`) until the process is gone, then check the file. If it was killed or `out.mp4` is missing, rerun (`--workers 1` on memory errors). A reply like "render is still going" is a failed delivery.

Budget the time: keep a first film to 30 s or less (the 11 s template renders in ~1-2 min; 30 s takes ~3-5 min, longer on a busy machine). Do a `--quality draft` render first to check motion, then the final `looks` render.

1920 × 1080, 30 fps. Expect roughly 4-8 s of wall time per film second with 2 workers (the board is redrawn every frame; whips render 4 sub-frames). `--quality draft` for a motion check.

## Vertical film (1080 x 1920, Shorts / Reels / TikTok)
```sh
cp templates/vertical.html index.html && cp templates/film-v.js film.js     # instead of step 1
npx -y hyperframes@0.8.96 lint .                                            # 0 errors
npx -y hyperframes@0.8.96 snapshot . --at 1,3,5,7 --no-end -o snapshots     # look at the PNGs: text inside y 250-1470, x 90-940
npx -y hyperframes@0.8.96 render . -o out.mp4 --quality looks --workers 2
ffprobe -v error -show_entries stream=width,height -of csv=p=0 out.mp4      # 1080,1920
ffmpeg -i out.mp4 -vf freezedetect=n=-50dB:d=1.2 -an -f null - 2>&1 | grep freeze   # no hits = no dead holds
```
The frame size is set in three places (CSS, `data-width`/`data-height`, canvas attributes) and the engine follows the canvas. Keep `DUR` in `film.js` equal to `data-duration`. Read the "Vertical 9:16" section in `STYLE.md` first.

## Troubleshooting
- **Blank frame:** a JS error; `npx -y hyperframes@0.8.96 validate .` prints it. A missing `fonts/` folder or a typo in `film.js` is the usual cause.
- **Text in the wrong font (captions look like sans):** `fonts/ArchitectsDaughter-Regular.ttf` not found next to `index.html`.
- **Frames differ between runs:** something in `film.js` uses `Math.random` or `Date`.
- **Out of memory:** `--workers 1`.
