#!/usr/bin/env bash
# Soft clay soundtrack for the "Narc" self-reflection card video (~16.7s, 500f@30fps).
# Calm pad bed + soft pops on card/title reveals + blips on pills + twinkles on
# number bubbles + gentle swishes on scene crossfades. Cuts (frames 95/190/285/380)
# = 3.17 / 6.33 / 9.50 / 12.67 s.
# Usage: bash scripts/narc-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/narc-video.mp4}"; OUT="${2:-../projects/cardnews/narc-video-sound.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
genf pad "(sin(2*PI*220*t)+sin(2*PI*277.18*t)+sin(2*PI*329.63*t))*0.3*(0.85+0.15*sin(2*PI*0.08*t))" 17.5 "lowpass=f=900, aecho=0.8:0.85:200:0.3"
genf pop "sin(2*PI*(260+520*t-180*t*t)*t)*exp(-11*t)" 0.4 "lowpass=f=1500, aecho=0.8:0.8:20:0.2"
genf blip "sin(2*PI*880*t)*exp(-22*t)*0.7 + sin(2*PI*1320*t)*exp(-26*t)*0.3" 0.2 "lowpass=f=3200"
genf twinkle "(sin(2*PI*1568*t)+0.6*sin(2*PI*2349*t))*exp(-9*t)" 0.6 "aecho=0.8:0.8:16|30:0.35|0.2"
genf swish "(random(0)*2-1)*exp(-26*(t-0.12)^2)" 0.3 "lowpass=f=1600, highpass=f=500, aecho=0.8:0.8:18:0.25"
rows=(
 "pad 0 0.22"
 "swish 3170 0.16" "swish 6330 0.16" "swish 9500 0.16" "swish 12670 0.16"
 "pop 320 0.34" "pop 640 0.30"
 "pop 3450 0.34" "pop 6620 0.34" "pop 9770 0.34"
 "pop 12920 0.34" "pop 13300 0.30"
 "twinkle 3300 0.18" "twinkle 6470 0.18" "twinkle 9640 0.18"
 "blip 3900 0.15" "blip 4050 0.15" "blip 4200 0.15"
 "blip 7060 0.15" "blip 7210 0.15" "blip 7360 0.15"
 "blip 10230 0.15" "blip 10380 0.15" "blip 10530 0.15"
 "blip 13450 0.16" "blip 13620 0.16" "blip 13790 0.16"
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; if [ "$1" = "pad" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=2[a$i];"; else fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; fi; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.6,acompressor=threshold=-20dB:ratio=3:attack=14:release=200,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.97,lowpass=f=15000,afade=t=out:st=16.1:d=0.5,atrim=0:16.72,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
