#!/usr/bin/env bash
# tools/score.sh: builds audio/score.wav (10 s) from ffmpeg tones only: a pizzicato pentatonic tune, a whoosh, a pop, a chime, a swell, footsteps.
# Nothing is sampled or downloaded, so the file is yours to use anywhere. Edit the NOTES / CUES lines to re-score a different film.
set -e
cd "$(dirname "$0")/.."; mkdir -p audio
IN=(); FC=""; n=0
add() { # add <freq> <start s> <dur s> <vol> <fade s>   one plucked sine note (two partials)
  IN+=(-f lavfi -t "$3" -i "sine=f=$1:r=32000"); FC+="[$n:a]afade=t=out:st=0:d=$3:curve=exp,volume=$4,adelay=$(printf '%d' "$(echo "$2*1000/1" | bc)")|$(printf '%d' "$(echo "$2*1000/1" | bc)")[a$n];"; n=$((n+1)); }
noise() { # noise <start> <dur> <vol> <lowpass> <highpass>   filtered noise burst: whoosh, footstep, pop
  IN+=(-f lavfi -t "$2" -i "anoisesrc=c=pink:r=32000:a=0.9"); FC+="[$n:a]highpass=f=$5,lowpass=f=$4,afade=t=in:st=0:d=0.05,afade=t=out:st=0:d=$2:curve=exp,volume=$3,adelay=$(printf '%d' "$(echo "$1*1000/1" | bc)")|$(printf '%d' "$(echo "$1*1000/1" | bc)")[a$n];"; n=$((n+1)); }
# tune: C major pentatonic plucks (C4 262, D4 294, E4 330, G4 392, A4 440, C5 523), one every 0.5 s with rests while Pip is startled
t=0; for f in 262 330 392 330 440 392 330 294  0 0 523 440 392 330 392 523 659 523 440 392 330 392 440 523 587 523 392 523; do
  if [ "$f" != 0 ]; then add $f $t 0.7 0.28; fi; t=$(echo "$t+0.36" | bc); done
add 131 0 2.7 0.22; add 98 5.4 4.6 0.2                                  # bass drone
noise 2.9 0.9 0.5 6000 800                                               # whoosh as the spark falls
noise 3.9 0.18 0.9 900 60                                                # landing pop
add 880 4.9 0.9 0.35; add 1319 4.98 0.9 0.25; add 1760 5.06 0.9 0.15    # pick-up chime
add 392 5.6 2.2 0.18; add 494 5.6 2.2 0.16; add 587 5.6 2.2 0.14        # swell chord
for s in 8.0 8.33 8.66 9.0 9.33 9.66; do noise $s 0.06 0.6 1800 300; done  # footsteps
M=""; for i in $(seq 0 $((n-1))); do M="$M[a$i]"; done
ffmpeg -loglevel error -y "${IN[@]}" -filter_complex "${FC}${M}amix=inputs=$n:normalize=0:duration=longest,alimiter=limit=0.9,atrim=0:10,apad=whole_dur=10,loudnorm=I=-18:TP=-2,aresample=22050" -ac 1 audio/score.wav
