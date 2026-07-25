#!/usr/bin/env bash
# Calm reflective soundtrack for the "남의 시선" quote reel (~17.9s, 536f@30fps).
# Scene changes at frames 104/208/312/416 = 3.47/6.93/10.40/13.87 s. No beat.
# Usage: bash scripts/mind-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/mind-reel.mp4}"; OUT="${2:-../projects/cardnews/mind-reel-sound.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
# warm calm pad (A minor-ish: A2 C3 E3 A3) — reflective
genf pad "(sin(2*PI*110*t)+sin(2*PI*130.81*t)+sin(2*PI*164.81*t)+0.6*sin(2*PI*220*t))*0.28*(0.88+0.12*sin(2*PI*0.08*t))" 18.4 "lowpass=f=1100, aecho=0.8:0.88:300:0.3"
# soft airy swish at scene changes
genf swish "(random(0)*2-1)*exp(-22*(t-0.15)^2)" 0.4 "lowpass=f=1500, highpass=f=350, aecho=0.8:0.85:26:0.28"
# gentle warm bell/twinkle for accents
genf bell "(sin(2*PI*659.25*t)+0.5*sin(2*PI*987.77*t))*exp(-4.5*t)" 1.2 "aecho=0.8:0.85:30|60:0.3|0.2"
# soft low resolve at the close
genf resolve "(sin(2*PI*146.83*t)+sin(2*PI*220*t))*exp(-1.6*t)" 2.0 "lowpass=f=800, aecho=0.8:0.8:120:0.25"
rows=(
 "pad 0 0.32"
 "swish 3470 0.4" "swish 6930 0.4" "swish 10400 0.4" "swish 13870 0.42"
 "bell 300 0.30" "bell 13870 0.34"
 "resolve 13870 0.4"
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; if [ "$1" = "pad" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=2[a$i];"; else fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; fi; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.2,acompressor=threshold=-20dB:ratio=3:attack=14:release=200,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.97,lowpass=f=15000,afade=t=out:st=17.2:d=0.6,atrim=0:17.85,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
