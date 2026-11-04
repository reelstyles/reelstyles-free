# Assets and licences

| Asset | Licence | File |
|---|---|---|
| `fonts/ArchivoBlack-Regular.ttf` (Archivo Black) | SIL Open Font License 1.1 | `LICENSES/ArchivoBlack-OFL.txt` |
| `fonts/Inter-800.woff2`, `fonts/Inter-500.woff2` (Inter) | SIL Open Font License 1.1 | `LICENSES/Inter-OFL.txt` |
| gsap (loaded from jsDelivr, not bundled) | GreenSock standard licence (free, commercial use allowed) | n/a |
| `engine/`, `templates/`, `tools/` | ReelStyles originals | n/a |

## Inspiration (no code copied)
The look (dark stage with blurred colour blobs, giant stacked type, slanted wipes, bracketed logo end) was studied from the showcase of iart-ai/motion-skills (MIT, Copyright (c) 2026 iart.ai). All code here is written from scratch for a canvas-2D engine; the MIT notice is kept in `LICENSES/motion-skills-MIT.txt` as a courtesy.

## What is better than the source
Frame-pure canvas engine (identical renders), baked-in min-size 28 px + fit-to-box, idle motion on every letter, a dead-hold checker (`tools/dead-holds.mjs`), outline echoes, slot-machine swap, procedural sound recipes.
