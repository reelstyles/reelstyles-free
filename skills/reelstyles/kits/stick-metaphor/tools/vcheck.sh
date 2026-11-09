#!/bin/bash
# tools/vcheck.sh [out.mp4]: the machine checks for a vertical Short, run before anyone looks at it (same file in every kit with
# engine/safe.js). One line per problem with its time and the fix; exit 1 on any. Needs ffmpeg/ffprobe + node.
#   size 1080x1920 · holds: no 1.2 s without change (freezedetect) · no black frames · no picture on 3 neighbouring 1-s tiles
#   (blurred SSIM >= 0.75 twice in a row: a new picture at least every 2 s, the proven format 10-24; the end card exempt) · frame 0 already moving · layout (tools/layout-check.mjs)
#   VCHECK_LEN=0: skip the 15-45 s length rule (a channel rule for our Shorts; tools/render.sh sets it for buyers' films)
cd "$(dirname "$0")/.." || exit 1
f=${1:-out.mp4}; [ -s "$f" ] || { echo "no $f"; exit 1; }
n=0; say() { echo "$*"; n=$((n + 1)); }
wh=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$f"); [ "$wh" = 1080x1920 ] || say "size $wh, need 1080x1920"
d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f"); end=$(echo "$d - 2.5" | bc)
[ "${VCHECK_LEN:-1}" = 1 ] && [ "$(echo "$d < 15 || $d > 45" | bc)" = 1 ] && say "length ${d}s, a Short here is 15-45 s: change DUR in film.js and data-duration in index.html"
nice -n 19 ffmpeg -v info -i "$f" -vf "freezedetect=n=-60dB:d=1.2,blackdetect=d=0.1:pix_th=0.08" -an -f null - 2>&1 |
  grep -oE "freeze_start: [0-9.]+|freeze_duration: [0-9.]+|black_start:[0-9.]+ black_end:[0-9.]+" | paste -sd' ' | grep -oE "freeze_start: [0-9.]+ freeze_duration: [0-9.]+|black_start:[0-9.]+ black_end:[0-9.]+" |
  while read -r l; do case $l in freeze*) set -- $l; echo "$2 s: nothing moves for $4 s (dead hold): add a new pose, a camera push or moving set pieces";; black*) echo "${l#black_start:} s: black frame(s): a broken cut or transition";; esac; done > /tmp/vcheck.$$
# neighbouring 1-s tiles (what a contact sheet shows): blurred greyscale SSIM; the same picture twice = a hold the eye sees
nice -n 19 ffmpeg -v error -i "$f" -filter_complex "[0:v]fps=1,scale=72:128,gblur=sigma=1.5,format=gray,split[a][b];[b]trim=start_frame=1,setpts=PTS-STARTPTS[c];[a][c]ssim=stats_file=/tmp/vcheck.$$.ss" -f null - 2>/dev/null
awk -v end="$end" '{ split($3, a, ":"); t = NR - 1; same = a[2] >= 0.75 && t + 1 < end; if (same && prev) printf "%d-%d s: the 1-s tiles at %d, %d and %d s look the same (ssim %.2f): cut to a new framing or a big visible result inside these seconds\n", t - 1, t + 1, t - 1, t, t + 1, a[2]; prev = same }' /tmp/vcheck.$$.ss >> /tmp/vcheck.$$
# the hook: frame 0 vs 0.5 s must differ (something already moving in the first frame)
s0=$(nice -n 19 ffmpeg -v error -i "$f" -filter_complex "[0:v]trim=end=0.6,fps=2,scale=72:128,format=gray,split[a][b];[b]trim=start_frame=1,setpts=PTS-STARTPTS[c];[a][c]ssim=stats_file=-" -f null - 2>/dev/null | head -1 | grep -oE "All:[0-9.]+" | cut -d: -f2)
[ -n "$s0" ] && [ "$(echo "$s0 > 0.97" | bc)" = 1 ] && echo "0-0.5 s: the opening barely moves (ssim $s0): frame 0 must be mid-action" >> /tmp/vcheck.$$
[ -f index.html ] && grep -q engine/safe.js index.html && { node tools/layout-check.mjs . >> /tmp/vcheck.$$ 2>&1 || true; }
grep -v "^$" /tmp/vcheck.$$ | sort -n | while read -r l; do echo "$l"; done; c=$(grep -cv "^$" /tmp/vcheck.$$); rm -f /tmp/vcheck.$$ /tmp/vcheck.$$.ss
[ $((n + c)) -eq 0 ] && echo "vcheck: pass" || { echo "vcheck: $((n + c)) problem(s)"; exit 1; }
