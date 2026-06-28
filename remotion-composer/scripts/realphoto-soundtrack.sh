#!/usr/bin/env bash
# Editorial soundtrack for the "RealPhoto" card-news (17s, 510f @30fps):
# 바쁨을 성과로 착각말라. ffmpeg-synthesized — warm pad bed + soft pitch-up
# "pop" on headline reveals + airy swishes on scene crossfades + twinkles on
# the number badges + a low sub-boom on hook & close. Calm/editorial, no beat.
# Usage: bash scripts/realphoto-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/busy-realphoto.mp4}"; OUT="${2:-../projects/cardnews/busy-realphoto-sound.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }

# warm minor-ish pad bed (A2 + C#3 + E3) with slow tremolo
genf pad "(sin(2*PI*220*t)+sin(2*PI*277.18*t)+sin(2*PI*329.63*t))*0.30*(0.85+0.15*sin(2*PI*0.07*t))" 17 "lowpass=f=820, aecho=0.8:0.85:240:0.3"
# soft pitch-up pop for headline reveals
genf pop "sin(2*PI*(240+520*t-170*t*t)*t)*exp(-10*t)" 0.45 "lowpass=f=1500, aecho=0.8:0.8:22:0.2"
# airy swish on crossfades
genf swish "(random(0)*2-1)*exp(-24*(t-0.13)^2)" 0.32 "lowpass=f=1700, highpass=f=480, aecho=0.8:0.8:18:0.25"
# twinkle for number badges
genf twinkle "(sin(2*PI*1568*t)+0.6*sin(2*PI*2349*t))*exp(-9*t)" 0.6 "aecho=0.8:0.8:16|30:0.35|0.2"
# low sub-boom for hook / close emphasis
genf boom "sin(2*PI*(70+30*exp(-6*t))*t)*exp(-5*t)" 0.9 "lowpass=f=180"
# light blip
genf blip "sin(2*PI*880*t)*exp(-22*t)*0.7 + sin(2*PI*1320*t)*exp(-26*t)*0.3" 0.2 "lowpass=f=3200"

# event timeline — "<sample> <delay_ms> <volume>"  (cuts: 3467 7133 10600 14067)
rows=(
 "pad 0 0.22"
 "boom 250 0.5" "boom 14250 0.45"
 "swish 3370 0.17" "swish 7040 0.17" "swish 10500 0.17" "swish 13970 0.17"
 "pop 600 0.32" "pop 1000 0.28"
 "pop 4330 0.32"
 "pop 7600 0.32" "pop 8100 0.30"
 "pop 11050 0.32" "pop 11550 0.30"
 "pop 14600 0.32" "pop 15100 0.30"
 "twinkle 7340 0.20" "twinkle 10800 0.20"
 "blip 650 0.16" "blip 1050 0.16" "blip 14650 0.16"
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav";
  if [ "$1" = "pad" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=2[a$i];";
  else fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; fi; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.4,acompressor=threshold=-20dB:ratio=3:attack=14:release=200,alimiter=limit=0.97,lowpass=f=15000,afade=t=out:st=16.4:d=0.6,atrim=0:17,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
