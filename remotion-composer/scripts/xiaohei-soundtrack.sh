#!/usr/bin/env bash
# Chalkboard soundtrack for the Xiaohei loop-engineering shorts (sample: 15s).
# ffmpeg-synthesized, offline: mysterious minor pad bed + chalk scratches on
# stroke draw-ons + soft pops on titles + ticks on checkmarks + swish on the
# scene cut. Mastered with loudnorm (I=-16) per collage-shorts skill §7.
# Usage: bash scripts/xiaohei-soundtrack.sh <in.mp4> <out.mp4> [dur=15]
set -euo pipefail
IN="${1:?in.mp4}"; OUT="${2:?out.mp4}"; DUR="${3:-15}"
AD="$(mktemp -d)"; SR=44100
FADE_ST=$(python3 -c "print(${DUR}-0.6)")
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
# A-minor-ish dark pad (A2 C3 E3) with slow swell — mysterious chalkboard mood
genf pad "(sin(2*PI*110*t)+sin(2*PI*130.81*t)+sin(2*PI*164.81*t)+0.5*sin(2*PI*220*t))*0.3*(0.8+0.2*sin(2*PI*0.07*t))" "$DUR" "lowpass=f=760, aecho=0.8:0.85:220:0.3"
# chalk scratch: shaped noise, mid-band
genf chalk "(random(0)*2-1)*exp(-14*(t-0.14)^2)*(0.7+0.3*sin(2*PI*23*t))" 0.42 "highpass=f=1400, lowpass=f=4200, volume=0.9"
# soft pop for titles
genf pop "sin(2*PI*(240+500*t-170*t*t)*t)*exp(-10*t)" 0.45 "lowpass=f=1500, aecho=0.8:0.8:22:0.2"
# tick for checkmarks
genf tick "sin(2*PI*988*t)*exp(-24*t)*0.7 + sin(2*PI*1480*t)*exp(-30*t)*0.3" 0.2 "lowpass=f=3600"
# twinkle for the yellow scribble accents
genf twinkle "(sin(2*PI*1244.5*t)+0.6*sin(2*PI*1864.7*t))*exp(-8*t)" 0.7 "aecho=0.8:0.8:16|32:0.35|0.2"
# scene-cut swish
genf swish "(random(0)*2-1)*exp(-24*(t-0.13)^2)" 0.34 "lowpass=f=1700, highpass=f=450, aecho=0.8:0.8:18:0.25"
rows=(
 "pad 0 0.55"
 "pop 200 0.32" "pop 1050 0.34" "pop 7700 0.34"
 "chalk 2150 0.28" "chalk 3400 0.24" "chalk 4400 0.26" "chalk 5300 0.24"
 "chalk 8900 0.28" "chalk 9600 0.24" "chalk 11000 0.26" "chalk 11500 0.22"
 "twinkle 6000 0.20" "twinkle 14000 0.18"
 "swish 7500 0.20"
 "tick 10970 0.20" "tick 11770 0.20" "tick 12570 0.20"
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; if [ "$1" = "pad" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=1.6[a$i];"; else fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; fi; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.2,acompressor=threshold=-20dB:ratio=3:attack=14:release=200,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.97,lowpass=f=15000,afade=t=out:st=${FADE_ST}:d=0.6,atrim=0:${DUR},aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
