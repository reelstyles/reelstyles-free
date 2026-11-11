# Countdown guessing quiz

A bright game-show quiz film. One drawn item per round sits on a candy-gradient stage. A 3 s ring drains, then the shadow floods with colour and the name springs in. Four difficulty bands each get a title card.

## Look

- Round = 5.1 s: 0.6 s item springs in, 3.0 s ring, 1.5 s payoff (`T_IN`, `T_RING`, `ROUND_LEN`). Title card = 1.3 s. A band is 6.4 s.
- Item: scale 1.45 (16:9) or 1.5 (9:16) in a ±200 px box, drawn first as a flat silhouette in the band tone with a plum drop shadow (blur 40, offset 18).
- Item breathes ±2.5 %, sways ±0.035 rad and bobs ±9 px. Flags wave continuously.
- Ring radius 155 px (16:9) or 175 px (9:16); it drains linearly, pulses 10 % each second, shakes and reddens in the last second, then becomes a check and shrinks away after zero.
- Reveal at 3.6 s: white flash (0.3 s), circular colour wipe from the item centre (radius 380 px in 0.55 s) with a 10 px white rim, item squash-bounce, name spring with tilt settle, 36 confetti pieces, score pill fills with a spring and a shine.
- Idle: rotating gradient, drifting stripes, rising bubbles, breathing spotlight, HUD pills bobbing ±4 px, shine sweep on the score bar.
- Title card: three expanding white rings (14 px), the band word springs in and grows 7 %, stars pop 0.12 s apart and twinkle.

## Palette

| Band | Gradient | Silhouette tone | Accent |
|---|---|---|---|
| easy | `#46E39B` → `#17A6D6` | `#0F5C8A` | `#FFE14D` |
| medium | `#5C9BFF` → `#9457FF` | `#2D1B7A` | `#FFE14D` |
| hard | `#FFA63D` → `#FF3D86` | `#7A1A4A` | `#FFF0A0` |
| impossible | `#C0143F` → `#2A0A55` | `#12041F` | `#FFD84A` |

The table is `BANDS` in `sets/stage.js`. Pills are white or plum `rgba(20,10,60,.4)`. Last-second red `#FF5A6E`. Confetti: accent, white, `#FF5FA2`, `#5CE1FF`, `#8DFF7A`. No third colour family per band.

## Type

Inter 900 (OFL, in `fonts/`), made chunky and round by a same-colour round-join stroke (7 % of the size) and a soft plum shadow. Upper case, 2-4 words. Prompt 64 px, answer 150 px, band word 270 px (190 px in 9:16). Always draw text with `text()`. It wraps, shrinks to fit `maxW` and clamps inside the frame. Its minimum is 30 px.

## Cast and props

No characters. The items in `ITEMS` (`sets/items.js`) are the cast:

- Shapes: `apple`, `banana`, `strawberry`, `pineapple`, `elephant`, `cat`, `fish`, `duck`.
- Flags (340 × 230 cloth on a pole): `japan`, `italy`, `sweden`, `switzerland`.

Stage pieces (`sets/stage.js`): `stageBg`, `vignette`, `star`, `hud`, `ring`, `confetti`, `quizRound`, `titleCard`.

Add an item by appending to `ITEMS`: `{ name, kind:'shapes', shapes:[{ c, ops:[...], x?:1 }] }`.

- Ops: `['e',x,y,rx,ry,rot]` ellipse, `['r',x,y,w,h,rad]` rounded rect, `['p',[x,y,...]]` polygon, `['l',[x,y,...],width]` thick curve.
- Body parts first, details last.
- Mark eyes, highlights and seeds `x:1` so they vanish in the shadow.

Flags: `{ kind:'flag', cols:[{ c, s, r:[x,y,w,h] }] }`. `s` is the dark silhouette tone. Flags are two-tone dark, so only the layout shows.

## Camera and motion

- Hard cuts between title card and round. Every beat pushes 1.0 → 1.04 (the default).
- 16:9: item left (700, 480), ring and score bar right, text under the item.
- 9:16: item top (540, 690), then text, ring, score bar. Keep clear of the top 180 px and bottom 150 px platform UI.
- `LAY` picks the layout by canvas size.
- Ease every move (`spring`, `EZ`, `seg`); only the ring is linear.

## Native moves

The rhythm is spring in, 3 s ring, colour wipe, name pop, score tick; the viewer learns it in one round. Variations:

- A double round (two items before the answer), a "which is bigger" split, or a streak counter in place of the score bar.
- A band-end bonus round with a longer ring (change `T_RING`), a reversed round (colour first, shape fades to shadow), or a fake-out tick (the ring stalls at 1).

## Pitfalls

- Dead holds: nothing may sit still more than 1.2 s. Keep every idle layer on and run the freeze check below.
- Never call `fillText` yourself; it bypasses the fit and clamp. Give HUD labels a `maxW` equal to their pill width.
- One focal point: the item, then the ring, then the score bar. Add no more.
- A silhouette must be guessable at phone size. Difficulty comes from the choice of item. The reveal colours must match the answer name.
- No second display font, no logos or look-alike channel branding.
- `data-duration` in the html = sum of the `beat()` lengths = the `mountFilm()` total.
- `drawItem` is a pure function of `t`. Confetti uses the seeded `rng`.

## Files

- Copy ONE root html, because HyperFrames refuses two:
  - 16:9 (1920 × 1080): `cp templates/index.html .`
  - 9:16 (1080 × 1920): `cp templates/vertical.html index.html`
- Also `cp templates/film.js .` and edit its `PLAN` list of `{ band, item, prompt }`. The sample is a working 25.6 s film, one round per band.
- Per band: `beat(1.3, ...titleCard)` then `beat(ROUND_LEN, ...quizRound)`; end with `mountFilm(total)`.
- Stills: one per round and per title card, for example `--at 0.8,2.2,4.4,5.8,10.5,17.5,24.6` for the sample.
- Freeze check, mandatory before delivering. It must print nothing:

```sh
ffmpeg -hide_banner -i out.mp4 -vf freezedetect=n=-60dB:d=0.4 -f null - 2>&1 | grep -a freeze_
```

- Sound is optional and made with ffmpeg only (nothing to license):

```sh
mkdir -p audio
ffmpeg -y -f lavfi -i "anoisesrc=d=0.04:c=white" -af "highpass=f=3000,afade=t=out:d=0.04,volume=0.6" audio/tick.wav
ffmpeg -y -f lavfi -i "sine=f=880:d=0.5" -f lavfi -i "sine=f=1320:d=0.5" -filter_complex "[0][1]amix=inputs=2,afade=t=out:d=0.5,volume=0.5" audio/pop.wav
ffmpeg -y -f lavfi -i "anoisesrc=d=0.5:c=pink" -af "highpass=f=500,afade=t=in:d=0.45,afade=t=out:st=0.45:d=0.05,volume=0.5" audio/whoosh.wav
ffmpeg -y -f lavfi -i "sine=f=196:d=26" -f lavfi -i "sine=f=294:d=26" -filter_complex "[0][1]amix=inputs=2,tremolo=f=2:d=0.3,lowpass=f=900,volume=0.25,afade=t=out:st=24:d=2" audio/bed.wav
```

  Round start = band × 6.4 + 1.3 s. Ticks at start + 0.6, 1.6, 2.6 s, whoosh at +3.2 s, pop at +3.72 s. Mix with `adelay` and `amix`.
