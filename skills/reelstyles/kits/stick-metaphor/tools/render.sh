#!/bin/bash
# tools/render.sh [out.mp4]: the one way to render a film from this kit (same file in every kit with engine/safe.js).
# Lints, renders, then runs every machine check; the film is only called out.mp4 when all of them pass. A film that fails is
# kept as out.FAILED.mp4 and each problem is printed with its time and the fix: change film.js and run this again.
#   9:16: tools/vcheck.sh (holds, same-picture seconds, hook, layout: hero/extras/props whole, labels, sizes)
#   16:9: tools/deadhold.sh when the kit has it, tools/layout-check.mjs when index.html loads engine/safe.js (doodle-film)
# 11-09: a cold run skipped the checks and shipped a hero cut by the left edge; the checks are part of the render now.
set -u
cd "$(dirname "$0")/.." || exit 1
o=${1:-out.mp4}; o=${o%.mp4}; v=$(grep -om1 'hyperframes@[0-9.]*' RENDER.md 2>/dev/null | cut -d@ -f2)
HF=${HF:-npx -y hyperframes@${v:-0.8.96}}
[ -f index.html ] && [ -f film.js ] || { echo "render: no index.html + film.js here (RENDER.md step 1 copies them from templates/)"; exit 1; }
$HF lint . || { echo "render: fix the lint errors first"; exit 1; }
rm -f "$o.mp4" "$o.FAILED.mp4" "$o.part.mp4"
$HF render . -o "$o.part.mp4" --quality looks --workers "${WORKERS:-2}" && [ -s "$o.part.mp4" ] || { echo "render: hyperframes render failed (RENDER.md, Troubleshooting)"; exit 1; }
wh=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$o.part.mp4")
if [ "$wh" = 1080x1920 ]; then
  VCHECK_LEN=0 bash tools/vcheck.sh "$o.part.mp4"; rc=$?
else
  p=""
  [ -f tools/deadhold.sh ] && p+=$(sh tools/deadhold.sh "$o.part.mp4" 2>&1 | grep -vx 'OK')
  grep -q 'engine/safe.js' index.html && p+=$(node tools/layout-check.mjs . 2>&1)
  rc=0; [ -n "$p" ] && { echo "$p"; rc=1; }
fi
if [ $rc -eq 0 ]; then
  mv -f "$o.part.mp4" "$o.mp4"; echo "render: $o.mp4 ($wh, $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$o.mp4") s), every check passed"
else
  mv -f "$o.part.mp4" "$o.FAILED.mp4"; echo "render: the checks above failed, the film is $o.FAILED.mp4: fix film.js and run bash tools/render.sh again"; exit 1
fi
