#!/usr/bin/env bash
# Soft claymorphism soundtrack for the "Clay" video (17s). ffmpeg-synthesized:
# warm pad bed + soft pitch-up "pop/boing" on card/title pops, soft blips on
# pills, twinkles on accents, gentle swishes on scene cuts. Calm, not beaty.
# Usage: bash scripts/clay-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/priority-clay.mp4}"; OUT="${2:-../projects/cardnews/priority-clay-sound.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
genf pad "(sin(2*PI*220*t)+sin(2*PI*277.18*t)+sin(2*PI*329.63*t))*0.3*(0.85+0.15*sin(2*PI*0.08*t))" 17 "lowpass=f=900, aecho=0.8:0.85:200:0.3"
genf pop "sin(2*PI*(260+520*t-180*t*t)*t)*exp(-11*t)" 0.4 "lowpass=f=1500, aecho=0.8:0.8:20:0.2"
genf blip "sin(2*PI*880*t)*exp(-22*t)*0.7 + sin(2*PI*1320*t)*exp(-26*t)*0.3" 0.2 "lowpass=f=3200"
genf twinkle "(sin(2*PI*1568*t)+0.6*sin(2*PI*2349*t))*exp(-9*t)" 0.6 "aecho=0.8:0.8:16|30:0.35|0.2"
genf swish "(random(0)*2-1)*exp(-26*(t-0.12)^2)" 0.3 "lowpass=f=1600, highpass=f=500, aecho=0.8:0.8:18:0.25"
rows=(
 "pad 0 0.22"
 "swish 3170 0.16" "swish 6670 0.16" "swish 10170 0.16" "swish 13670 0.16"
 "pop 300 0.34" "pop 620 0.34" "pop 760 0.30" "pop 3430 0.34" "pop 6930 0.34" "pop 10430 0.34" "pop 13930 0.34"
 "twinkle 640 0.18" "twinkle 13960 0.18"
 "blip 70 0.15" "blip 1000 0.15"
 "blip 3970 0.15" "blip 4130 0.15" "blip 4300 0.15"
 "blip 7470 0.15" "blip 7630 0.15" "blip 7800 0.15"
 "blip 10970 0.15" "blip 11130 0.15" "blip 11300 0.15"
 "blip 14200 0.16" "blip 14370 0.16" "blip 14530 0.16"
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; if [ "$1" = "pad" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=2[a$i];"; else fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; fi; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.6,acompressor=threshold=-20dB:ratio=3:attack=14:release=200,alimiter=limit=0.97,lowpass=f=15000,afade=t=out:st=16.5:d=0.5,atrim=0:17,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
