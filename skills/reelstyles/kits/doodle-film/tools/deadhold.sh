#!/bin/sh
# Dead-hold check: reports any region of the render that stays unchanged for >= 1.2 s.
# Usage: sh tools/deadhold.sh out.mp4      (prints OK, or one line per frozen tile with its time range, exit 1)
f="${1:?usage: deadhold.sh out.mp4}"; hits=0
for r in 0 1 2; do for c in 0 1 2 3; do
  out=$(ffmpeg -nostdin -hide_banner -i "$f" -an -vf "crop=iw/4:ih/3:iw/4*$c:ih/3*$r,freezedetect=n=-55dB:d=1.2" -f null - 2>&1 | grep -E "freeze_(start|end)" | tr '\n' ' ')
  if [ -n "$out" ]; then echo "tile row $r col $c: $out"; hits=$((hits+1)); fi
done; done
[ $hits -eq 0 ] && echo OK || { echo "$hits tile(s) frozen: add camera drift, breathing, a boil or a staggered build there"; exit 1; }
