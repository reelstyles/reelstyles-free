# Pop comic panels: render steps

## 0. Requirements (once)
Node.js >= 22, ffmpeg on the PATH. HyperFrames runs through `npx`, pinned: `npx -y hyperframes@0.8.96 <command>`. Internet on first run (npm, Chrome, gsap from jsDelivr).

## 1. Set up
Work in the kit folder (or a copy). The project root holds `engine/`, `characters/`, `sets/`, `fonts/`.
```sh
cp templates/index.html templates/film.js .
```
Edit `film.js`: `PANELS` (quads + scene functions), `SHOTS` (landing/leave times), `overlay()`, the end card. Keep `DUR` in `film.js` equal to `data-duration` in `index.html`; shots tile the film with no gap.

## 2. Look before you render
```sh
npx -y hyperframes@0.8.96 lint .                                   # must be 0 errors
npx -y hyperframes@0.8.96 snapshot . --at 0.5,3,5.2,7,9.4,11.2,13 --no-end -o snapshots
```
Open the PNGs and judge them against `RUBRIC.md`. Do at least 2 rounds. One time per panel, just after its last event.

## 3. Render
```sh
npx -y hyperframes@0.8.96 render . -o out.mp4 --quality looks --workers 2
ffprobe -v error -show_entries format=duration -of csv=p=0 out.mp4
ffmpeg -loglevel error -y -i out.mp4 -vf "fps=2,scale=480:-1,tile=4x8" -frames:v 1 sheet.jpg
```
1920 x 1080, 30 fps. About 7 s of wall time per film second with 2 workers on a shared machine (draft quality about the same).

## 4. Dead-hold check (mandatory before delivering)
```sh
ffmpeg -hide_banner -i out.mp4 -vf freezedetect=n=0.003:d=1.0 -an -f null - 2>&1 | grep freeze_start
```
**Run this and fix every hit before delivering**: every printed `freeze_start` is a span with nothing moving for over a second. Add camera drift, breathing, boil (`grp()`), or stagger a build there, then re-render. It must print nothing.

## Vertical film (9:16, 1080 x 1920: Shorts, Reels, TikTok)
Read "Vertical pitfalls" in `STYLE.md` first. The sample is a 34 s VS proverb Short ("Brains beat brawn"): 17 full-frame panels of 2 s, six sets.
```sh
cp templates/vertical.html index.html && cp templates/film-v.js film.js
npx -y hyperframes@0.8.96 lint .          # 0 errors
node tools/layout-check.mjs .             # prints nothing (hero size, labels, faces, edges per 0.25 s, framing over the film)
npx -y hyperframes@0.8.96 snapshot . --at 0.1,3,5,7,8.8,11,13,15,17,19,21,23,24.8,27,29,31,33 --no-end -o snapshots
npx -y hyperframes@0.8.96 render . -o out.mp4 --quality looks --workers 2
bash tools/vcheck.sh out.mp4              # must print "vcheck: pass": size, length, holds, same-picture seconds, hook, layout, with times
ffmpeg -v error -y -i out.mp4 -vf "fps=1,scale=180:320,tile=9x4" -frames:v 1 sheet.jpg   # look at it: hero big, faces whole, labels readable
```
If you change the length, update `data-duration` in `index.html` and `DUR` in `film.js` (31-38 s for a Short).

## 5. Sound (optional; silent is valid)
Foley with ffmpeg only, then mix under any voice:
```sh
ffmpeg -f lavfi -i "sine=f=70:d=0.25" -f lavfi -i "anoisesrc=d=0.25:c=pink:a=0.5" -filter_complex "[0][1]amix,afade=t=out:st=0.05:d=0.2" thump.wav   # impact
ffmpeg -f lavfi -i "anoisesrc=d=0.3:c=white:a=0.3" -af "highpass=f=2000,afade=t=out:st=0.05:d=0.25" rustle.wav                                # page turn
```
Place them at the burst times (`D.arr + 0.55`, etc.) with `adelay`, add `<audio class="clip" data-start="0" data-duration="15.2" data-track-index="0" src="audio/mix.wav" data-volume="1">` inside `#root`. Local TTS: `npx -y hyperframes@0.8.96 tts script.txt -o audio/voice.wav` (needs the Kokoro python setup from the HyperFrames docs).

## Troubleshooting
- Black/blank frames: a JS error; `npx -y hyperframes@0.8.96 validate .`.
- Wrong lettering: keep `fonts/` next to `index.html`.
- Jitter between renders: something uses `Math.random`/`Date`.
- Out of memory: `--workers 1`.
