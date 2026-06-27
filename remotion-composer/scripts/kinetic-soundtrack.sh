#!/usr/bin/env bash
# Build and attach the synthesized soundtrack for the "Kinetic" video.
# Cinematic ambient sound design generated entirely with ffmpeg (no external
# assets) — deep sub drone, airy whooshes, a build-up riser into a reverberant
# boom on the "붕괴" landing, and warm pad swells on the resolves. Reverb +
# low-pass + master compression keep it polished (no toy beeps/bells).
# Synced to src/kinetic/Kinetic.tsx (1080x1920, 30fps, 24s).
#
# Usage: bash scripts/kinetic-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/direction-kinetic.mp4}"
OUT="${2:-../projects/cardnews/direction-kinetic-sound.mp4}"
AD="$(mktemp -d)"
SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }

# --- sound sources (timbre + reverb/low-pass baked in) ---------------------
genf drone "(sin(2*PI*41.2*t)*0.5 + sin(2*PI*41.55*t)*0.4 + sin(2*PI*82.4*t)*0.28 + sin(2*PI*61.7*t)*0.16)*(0.82+0.18*sin(2*PI*0.06*t))" 24 "lowpass=f=210, aecho=0.8:0.85:180:0.3"
genf riser "((random(0)*2-1)*0.8 + sin(2*PI*(120+480*t)*t)*0.25)*pow(t,2.2)" 1.15 "lowpass=f=3200, aecho=0.8:0.8:120:0.3"
genf boom  "sin(2*PI*45*t - 30*exp(-6*t))*exp(-2.3*t) + (random(0)*2-1)*exp(-26*t)*0.35" 2.3 "lowpass=f=185, aecho=0.85:0.9:130|260:0.4|0.25, volume=1.5"
genf swell "(sin(2*PI*146.83*t)+sin(2*PI*185*t)+sin(2*PI*220*t)+sin(2*PI*293.66*t))*0.25*(1-exp(-3.5*t))*exp(-0.55*t)" 3.2 "lowpass=f=1300, aecho=0.8:0.85:150|300:0.35|0.22"

# --- placement: "file delay_ms volume" — minimal: drone bed + riser + boom
# + a single warm swell at the turn + a soft outro close. Lots of space.
rows=(
 "drone 0 0.14"
 "riser 6400 0.22"
 "boom 7570 1.0"
 "swell 15300 0.22"
 "swell 20900 0.15"
)
inputs=""; fc=""; mixlabels=""; n=${#rows[@]}
for i in "${!rows[@]}"; do
  set -- ${rows[$i]}; f=$1; d=$2; v=$3
  inputs+=" -i $AD/$f.wav"
  if [ "$f" = "drone" ]; then
    fc+="[$i]adelay=$d:all=1,volume=$v,afade=t=in:st=0:d=2.5[a$i];"
  else
    fc+="[$i]adelay=$d:all=1,volume=$v[a$i];"
  fi
  mixlabels+="[a$i]"
done
fc+="${mixlabels}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]acompressor=threshold=-18dB:ratio=3:attack=20:release=250,alimiter=limit=0.95,lowpass=f=15000,volume=1.2,afade=t=out:st=23.2:d=0.8,atrim=0:24,aformat=channel_layouts=stereo[out]"

ffmpeg -y -v error $inputs -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"
rm -rf "$AD"
