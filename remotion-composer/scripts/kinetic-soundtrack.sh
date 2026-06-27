#!/usr/bin/env bash
# Build and attach the synthesized soundtrack for the "Kinetic" video.
# All sound is generated with ffmpeg (no external assets) and synced to the
# on-screen events of src/kinetic/Kinetic.tsx (1080x1920, 30fps, 24s).
#
# Usage: bash scripts/kinetic-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/direction-kinetic.mp4}"
OUT="${2:-../projects/cardnews/direction-kinetic-sound.mp4}"
AD="$(mktemp -d)"
SR=44100
gen(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -ac 1 "$AD/$1.wav"; }

# --- sound sources ---------------------------------------------------------
gen boom   "(sin(2*PI*55*t + 10*exp(-9*t))*exp(-3.2*t)) + ((random(0)*2-1)*exp(-45*t)*0.5)" 1.5
ffmpeg -y -v error -i "$AD/boom.wav"   -af "lowpass=f=420,volume=1.4"          "$AD/_b.wav" && mv "$AD/_b.wav" "$AD/boom.wav"
gen whoosh "((random(0)*2-1))*exp(-30*(t-0.18)^2)" 0.42
ffmpeg -y -v error -i "$AD/whoosh.wav" -af "lowpass=f=2800,highpass=f=300"     "$AD/_w.wav" && mv "$AD/_w.wav" "$AD/whoosh.wav"
gen riser  "((random(0)*2-1)*0.6 + sin(2*PI*(150+700*t)*t)*0.5) * pow(t,2)" 1.0
ffmpeg -y -v error -i "$AD/riser.wav"  -af "lowpass=f=4000"                    "$AD/_r.wav" && mv "$AD/_r.wav" "$AD/riser.wav"
gen swish  "sin(2*PI*(350+1500*t)*t)*exp(-7*t)" 0.35
gen chime  "(sin(2*PI*880*t)+0.5*sin(2*PI*1320*t)+0.25*sin(2*PI*1760*t))*exp(-3.5*t)" 1.2
gen pop    "sin(2*PI*520*t)*exp(-26*t)" 0.12
gen drone  "(sin(2*PI*55*t)*0.6 + sin(2*PI*110*t)*0.5 + sin(2*PI*164.81*t)*0.35)*(0.85+0.15*sin(2*PI*0.08*t))" 24
gen pad    "(sin(2*PI*146.83*t)+sin(2*PI*220*t)+sin(2*PI*293.66*t))*0.33*(0.8+0.2*sin(2*PI*0.1*t))" 13

# --- placement: "file delay_ms volume" synced to scene events --------------
rows=(
 "drone 0 0.12" "pad 10500 0.10"
 "pop 600 0.18" "pop 1150 0.18" "pop 1850 0.18"
 "whoosh 4100 0.22" "whoosh 4400 0.22" "whoosh 4700 0.22" "whoosh 5000 0.22" "whoosh 5300 0.22"
 "riser 6550 0.30" "boom 7570 0.95"
 "riser 14200 0.22"
 "swish 11170 0.18" "swish 11430 0.18" "swish 11700 0.18" "swish 11970 0.18" "swish 12230 0.18"
 "chime 15400 0.32" "chime 17550 0.22" "chime 18100 0.22" "chime 21000 0.26"
 "pop 22150 0.18"
)
inputs=""; fc=""; mixlabels=""; n=${#rows[@]}
for i in "${!rows[@]}"; do
  set -- ${rows[$i]}; f=$1; d=$2; v=$3
  inputs+=" -i $AD/$f.wav"
  if [ "$f" = "drone" ]; then
    fc+="[$i]adelay=$d:all=1,volume=$v,afade=t=in:st=0:d=1.5[a$i];"
  else
    fc+="[$i]adelay=$d:all=1,volume=$v[a$i];"
  fi
  mixlabels+="[a$i]"
done
fc+="${mixlabels}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=1.3,alimiter=limit=0.95,afade=t=out:st=23.2:d=0.8,atrim=0:24,aformat=channel_layouts=stereo[out]"

ffmpeg -y -v error $inputs -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"
rm -rf "$AD"
