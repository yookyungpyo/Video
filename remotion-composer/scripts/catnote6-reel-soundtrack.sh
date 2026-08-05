#!/usr/bin/env bash
# Calm minimal ambient for a 6-card cat-note reel (~21.6s, 648f@30fps, 6 × 108f).
# Soft low pad + sparse arpeggio + a gentle blip on each card turn (every 3.6s) +
# a soft closing tone on the last card (18.0s).
# Usage: bash scripts/catnote6-reel-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/redflags-reel.mp4}"; OUT="${2:-../projects/cardnews/redflags-reel-sound.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
genf pad "(sin(2*PI*110*t)+0.8*sin(2*PI*164.81*t)+0.6*sin(2*PI*220*t)+0.4*sin(2*PI*277.18*t))*0.16*(0.9+0.1*sin(2*PI*0.05*t))" 22.2 "lowpass=f=1100, aecho=0.8:0.9:400:0.3"
genf arp "sin(2*PI*(329.63*eq(mod(floor(t/0.75),4),0)+440*eq(mod(floor(t/0.75),4),1)+493.88*eq(mod(floor(t/0.75),4),2)+440*eq(mod(floor(t/0.75),4),3))*t)*exp(-4.2*mod(t,0.75))*0.34" 21.8 "lowpass=f=2200, aecho=0.8:0.85:300:0.3"
genf sub "sin(2*PI*55*t)*exp(-5*mod(t,1.2))*0.8" 21.8 "lowpass=f=140"
genf tone "(sin(2*PI*329.63*t)+sin(2*PI*493.88*t))*exp(-1.4*t)*0.5" 3.2 "aecho=0.8:0.85:260:0.25"
genf blip "sin(2*PI*880*t)*exp(-16*t)*0.4" 0.3 "lowpass=f=2400, aecho=0.8:0.85:120:0.25"
rows=(
 "pad 0 0.32"
 "arp 300 0.22"
 "sub 300 0.26"
 "blip 3600 0.3" "blip 7200 0.3" "blip 10800 0.3" "blip 14400 0.3" "blip 18000 0.34"
 "tone 18000 0.36"
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; if [ "$1" = "pad" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=2.5[a$i];"; elif [ "$1" = "arp" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=3[a$i];"; else fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; fi; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.0,acompressor=threshold=-20dB:ratio=3:attack=16:release=220,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.97,lowpass=f=14000,afade=t=out:st=20.7:d=0.7,atrim=0:21.6,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
