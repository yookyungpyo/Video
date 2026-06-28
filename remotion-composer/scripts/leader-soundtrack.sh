#!/usr/bin/env bash
# Soft claymorphism soundtrack for the "Leader" video (~17.7s, 530f@30fps).
# ffmpeg-synthesized: warm pad bed + soft pops on title/card pops, blips on
# pills, a gentle rising "riser" under the bar-chart grow with two soft dings as
# the WHY/HOW bars land, twinkles on accents, swishes on scene cuts.
# Scene cuts (frames): 90=3.00s, 220=7.33s, 320=10.67s, 420=14.00s.
# Usage: bash scripts/leader-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/leader.mp4}"; OUT="${2:-../projects/cardnews/leader-sound.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
genf pad "(sin(2*PI*220*t)+sin(2*PI*277.18*t)+sin(2*PI*329.63*t))*0.3*(0.85+0.15*sin(2*PI*0.08*t))" 18 "lowpass=f=900, aecho=0.8:0.85:200:0.3"
genf pop "sin(2*PI*(260+520*t-180*t*t)*t)*exp(-11*t)" 0.4 "lowpass=f=1500, aecho=0.8:0.8:20:0.2"
genf blip "sin(2*PI*880*t)*exp(-22*t)*0.7 + sin(2*PI*1320*t)*exp(-26*t)*0.3" 0.2 "lowpass=f=3200"
genf twinkle "(sin(2*PI*1568*t)+0.6*sin(2*PI*2349*t))*exp(-9*t)" 0.6 "aecho=0.8:0.8:16|30:0.35|0.2"
genf swish "(random(0)*2-1)*exp(-26*(t-0.12)^2)" 0.3 "lowpass=f=1600, highpass=f=500, aecho=0.8:0.8:18:0.25"
genf riser "sin(2*PI*(160+220*t)*t)*0.5*(t/1.2)" 1.2 "lowpass=f=1700, aecho=0.8:0.8:24:0.3"
genf ding "(sin(2*PI*1318.5*t)+0.5*sin(2*PI*1976*t))*exp(-7*t)" 0.7 "aecho=0.8:0.8:20|36:0.3|0.18"
rows=(
 "pad 0 0.22"
 "swish 3000 0.16" "swish 7330 0.16" "swish 10670 0.16" "swish 14000 0.16"
 "pop 300 0.34" "pop 670 0.34" "pop 7600 0.34" "pop 10930 0.34" "pop 14270 0.34"
 "riser 3150 0.30"
 "ding 3520 0.34" "ding 3800 0.34"
 "twinkle 640 0.18" "twinkle 14560 0.18"
 "blip 70 0.15" "blip 1070 0.15"
 "blip 8130 0.15" "blip 8300 0.15" "blip 8470 0.15"
 "blip 11470 0.15" "blip 11630 0.15" "blip 11800 0.15"
 "blip 14530 0.16" "blip 14750 0.16"
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; if [ "$1" = "pad" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=2[a$i];"; else fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; fi; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.6,acompressor=threshold=-20dB:ratio=3:attack=14:release=200,alimiter=limit=0.97,lowpass=f=15000,afade=t=out:st=17.1:d=0.5,atrim=0:17.7,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
