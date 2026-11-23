#!/bin/bash
# tools/render.sh [out.mp4]: the one way to render a text-story film. Run from the film folder (kit copy with index.html
# + film.js). Lint -> layout check (browser only, before any video) -> render -> dead-hold check + clip-measure gate.
# A film that fails a check after the render is kept as out.FAILED.mp4; fix film.js (or the kit) and run this again.
set -u
cd "$(dirname "$0")/.." || exit 1
o=${1:-out.mp4}; o=${o%.mp4}
v=$(grep -o 'hyperframes@[0-9.]*' kit.json STYLE.md 2>/dev/null | head -1 | cut -d@ -f2)
HF=${HF:-npx -y hyperframes@${v:-0.8.96}}
[ -f index.html ] && [ -f film.js ] || { echo "render: no index.html + film.js here (cp templates/index.html templates/film.js .)"; exit 1; }
$HF lint . || { echo "render: fix the lint errors first"; exit 1; }
node tools/layout-check.mjs . || { echo "render: layout rules failed before rendering (no video made): fix film.js and run again"; exit 1; }
rm -f "$o.mp4" "$o.FAILED.mp4" "$o.part.mp4"
nice -n 19 $HF render . -o "$o.part.mp4" --quality looks --workers "${WORKERS:-2}" && [ -s "$o.part.mp4" ] || { echo "render: hyperframes render failed"; exit 1; }
p=$(node tools/holdcheck.mjs "$o.part.mp4" 1.2 2>&1) || { echo "$p"; mv -f "$o.part.mp4" "$o.FAILED.mp4"; echo "render: dead holds, film kept as $o.FAILED.mp4"; exit 1; }
CM=""; for c in tools/clip-measure.mjs ../../tools/clip-measure.mjs ../../../../tools/clip-measure.mjs; do [ -f "$c" ] && { CM=$c; break; }; done
if [ -n "$CM" ]; then node "$CM" "$o.part.mp4" --gate || { mv -f "$o.part.mp4" "$o.FAILED.mp4"; echo "render: clip-measure gate failed, film kept as $o.FAILED.mp4"; exit 1; }; fi
mv -f "$o.part.mp4" "$o.mp4"; echo "render: $o.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$o.mp4") s), every check passed"
