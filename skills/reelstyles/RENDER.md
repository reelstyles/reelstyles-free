# Render guide (all ReelStyles kits)

Every kit has its own `RENDER.md` with the exact files to edit; this is the shared part. Each kit folder is a self-contained HyperFrames project: copy `templates/index.html` (and `templates/film.js` where the kit has one) to the kit root, edit, look at stills, render.

## 0. Requirements (once)

- Node.js ≥ 22 and ffmpeg on the PATH. Chrome is downloaded by HyperFrames itself on first use.
- HyperFrames runs through `npx`, pinned to the version this kit was tested with: `npx -y hyperframes@0.8.96 <command>`. Check the machine with `npx -y hyperframes@0.8.96 doctor`.
- Internet on first run (npm package, Chrome, gsap from jsDelivr). After that, renders run locally; nothing is uploaded.

## 1. Set up the project

Work in the kit folder itself (or a copy of it). The project root is the folder that holds `engine/`, `fonts/` and the rest:

```sh
cp templates/index.html .            # and templates/film.js if the kit has one
```

Edit the film (the kit's RENDER.md says which file) and keep the root `data-duration` equal to the film length.

## 2. Look before you render (stills)

```sh
npx -y hyperframes@0.8.96 lint .                                   # must be 0 errors
npx -y hyperframes@0.8.96 snapshot . --at 1,4,8,12 --no-end -o snapshots
```

Open the PNGs in `snapshots/` and check them against `RUBRIC.md`. Fix and repeat: plan at least 3 still rounds (blocking → acting/composition → polish). Stills are cheap, full renders are not.

## 3. Render

```sh
npx -y hyperframes@0.8.96 render . -o out.mp4 --quality looks --workers 2
ffprobe -v error -show_entries format=duration -of csv=p=0 out.mp4   # check the length
```

1920 × 1080, 30 fps, H.264. About 1-3 s of wall time per film second on a 4-core machine with 2 workers (more workers = faster, ~256 MB RAM each). For a quick motion check render with `--quality draft`.

Check the result: pull a contact sheet and look at it.

```sh
ffmpeg -loglevel error -y -i out.mp4 -vf "fps=1/4,scale=480:-1,tile=4x3" -frames:v 1 sheet.jpg
```

## 4. Sound (optional; a silent film is a valid render)

Write the narration first, render the voice, then time the shots to it.

**Option A: local TTS, free (Kokoro-82M through HyperFrames).** Runs on CPU, no account:

```sh
python3 -m venv ~/.kokoro && ~/.kokoro/bin/pip install kokoro-onnx soundfile   # once (Python ≥ 3.10)
export HYPERFRAMES_PYTHON=~/.kokoro/bin/python                                 # HyperFrames uses this python for TTS
npx -y hyperframes@0.8.96 tts --list                                  # voices (the model downloads on first use)
npx -y hyperframes@0.8.96 tts script.txt -o audio/voice.wav -v am_michael -s 0.95
npx -y hyperframes@0.8.96 transcribe audio/voice.wav --json          # word-level timestamps for cueing shots
```

**Option B: bring your own ElevenLabs key.** Your account, your plan's licence terms (free plans are non-commercial):

```sh
export ELEVENLABS_API_KEY=...        # never commit it, never put it in the project files
curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/<voice_id>?output_format=mp3_44100_128" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" -H "Content-Type: application/json" \
  -d '{"text": "Your narration here.", "model_id": "eleven_multilingual_v2"}' -o audio/voice.mp3
```

Music/SFX: only tracks you hold a licence for. Mix to one file (voice around −16 LUFS, music 18-22 LU under the voice), for example:

```sh
ffmpeg -i audio/voice.wav -i audio/music.mp3 -filter_complex "[1]volume=0.12[m];[0][m]amix=inputs=2:duration=first,loudnorm=I=-16:TP=-1.5" audio/mix.wav
```

Then add one audio clip inside the root element of `index.html` (its `data-duration` = the film length):

```html
<audio id="mix" class="clip" data-start="0" data-duration="40" data-track-index="0" src="audio/mix.wav" data-volume="1"></audio>
```

## Troubleshooting

- **Black or blank frames:** a JS error. `npx -y hyperframes@0.8.96 validate .` prints the console errors.
- **Frames differ between renders, or jitter:** something uses `Math.random`, `Date` or `performance.now`. Every frame must be a pure function of the film time.
- **Wrong font in stills:** the font did not load; keep the `fonts/` folder next to `index.html`.
- **Render killed (out of memory):** use `--workers 1`.
