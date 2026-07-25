#!/usr/bin/env bash
# Running-rhythm soundtrack for the "남의 시선" reel (~17.9s, 536f@30fps).
# Warm pad + footfall rhythm: subtle JOG cadence from scene 2, then a faster,
# louder SPRINT cadence on the final scene. Scene changes 104/208/312/416.
# Usage: bash scripts/run-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/mind-reel.mp4}"; OUT="${2:-../projects/cardnews/mind-reel-sound.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
# warm open pad (A + E, hopeful)
genf pad "(sin(2*PI*110*t)+sin(2*PI*164.81*t)+sin(2*PI*220*t)+0.5*sin(2*PI*329.63*t))*0.24*(0.88+0.12*sin(2*PI*0.09*t))" 18.4 "lowpass=f=1300, aecho=0.8:0.85:240:0.28"
# JOG cadence (~0.36s / ~167 spm): soft sub-kick + off-beat footstep tick
genf jogk "sin(2*PI*60*t)*exp(-14*mod(t,0.36))" 10.0 "lowpass=f=190, afade=t=in:st=0:d=0.8, afade=t=out:st=9.2:d=0.8"
genf jogt "(random(0)*2-1)*exp(-240*mod(t+0.18,0.36))" 10.0 "highpass=f=4500, lowpass=f=11000, afade=t=in:st=0:d=0.8, afade=t=out:st=9.2:d=0.8"
# SPRINT cadence (~0.25s / ~240 spm): faster, louder
genf sprk "sin(2*PI*64*t)*exp(-15*mod(t,0.25))" 4.2 "lowpass=f=200, afade=t=in:st=0:d=0.3"
genf sprt "(random(0)*2-1)*exp(-280*mod(t+0.125,0.25))" 4.2 "highpass=f=4800, lowpass=f=12000, afade=t=in:st=0:d=0.3"
# riser + downbeat hit into the sprint
genf riser "sin(2*PI*(180+700*t)*t)*(t/0.7)*0.8" 0.7 "lowpass=f=4200"
genf hit "sin(2*PI*(120-52*t)*t)*exp(-9*t)" 0.6 "lowpass=f=470, aecho=0.8:0.7:60:0.2"
# airy swish at scene changes
genf swish "(random(0)*2-1)*exp(-22*(t-0.15)^2)" 0.4 "lowpass=f=1500, highpass=f=350, aecho=0.8:0.85:24:0.25"
rows=(
 "pad 0 0.30"
 "swish 3470 0.4" "swish 6930 0.4" "swish 10400 0.4" "swish 13870 0.42"
 "jogk 3470 0.50" "jogt 3470 0.34"
 "sprk 13870 0.68" "sprt 13870 0.46"
 "riser 13200 0.5" "hit 13870 0.55"
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; if [ "$1" = "pad" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=1.5[a$i];"; else fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; fi; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.2,acompressor=threshold=-20dB:ratio=3:attack=12:release=180,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.97,lowpass=f=16000,afade=t=out:st=17.2:d=0.6,atrim=0:17.85,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
