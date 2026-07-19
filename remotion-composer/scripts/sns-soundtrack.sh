#!/usr/bin/env bash
# Soft clay soundtrack for the "Sns" 5-card video (~18.4s, 550f@30fps).
# Cuts (frames 95/200/325/430) = 3.17 / 6.67 / 10.83 / 14.33 s.
# Usage: bash scripts/safety-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/sns-video.mp4}"; OUT="${2:-../projects/cardnews/sns-video-sound.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
genf pad "(sin(2*PI*220*t)+sin(2*PI*277.18*t)+sin(2*PI*329.63*t))*0.3*(0.85+0.15*sin(2*PI*0.07*t))" 19 "lowpass=f=900, aecho=0.8:0.85:200:0.3"
genf pop "sin(2*PI*(260+520*t-180*t*t)*t)*exp(-11*t)" 0.4 "lowpass=f=1500, aecho=0.8:0.8:20:0.2"
genf blip "sin(2*PI*880*t)*exp(-22*t)*0.7 + sin(2*PI*1320*t)*exp(-26*t)*0.3" 0.2 "lowpass=f=3200"
genf twinkle "(sin(2*PI*1568*t)+0.6*sin(2*PI*2349*t))*exp(-9*t)" 0.6 "aecho=0.8:0.8:16|30:0.35|0.2"
genf swish "(random(0)*2-1)*exp(-26*(t-0.12)^2)" 0.3 "lowpass=f=1600, highpass=f=500, aecho=0.8:0.8:18:0.25"
rows=(
 "pad 0 0.22"
 "swish 3450 0.16" "swish 6950 0.16" "swish 10450 0.16" "swish 13950 0.16"
 "pop 320 0.34" "pop 640 0.30"
 "pop 3450 0.34" "pop 6800 0.34" "pop 10300 0.34"
 "pop 13650 0.34" "pop 14000 0.30"
 "twinkle 3300 0.18" "twinkle 6900 0.18"
 "blip 3900 0.15" "blip 4050 0.15" "blip 4200 0.15"
 "blip 7000 0.15" "blip 7150 0.15" "blip 7300 0.15"
 
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; if [ "$1" = "pad" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=2[a$i];"; else fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; fi; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.6,acompressor=threshold=-20dB:ratio=3:attack=14:release=200,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.97,lowpass=f=15000,afade=t=out:st=16.9:d=0.5,atrim=0:17.55,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
