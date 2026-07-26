#!/usr/bin/env bash
# Warm cozy ambient for the bold card-news reel (~28.8s, 864f@30fps, 9 cards ×
# 96f). Continuous pad + gentle arpeggio + soft sub pulse + a swish on each card
# transition (every 3.2s) + a warm lift on the closing card (25.6s).
# Usage: bash scripts/bold-reel-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/bold-reel.mp4}"; OUT="${2:-../projects/cardnews/bold-reel-sound.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
genf pad "(sin(2*PI*130.81*t)+0.85*sin(2*PI*196*t)+0.7*sin(2*PI*261.63*t)+0.5*sin(2*PI*329.63*t))*0.17*(0.9+0.1*sin(2*PI*0.07*t))" 29.4 "lowpass=f=1500, aecho=0.8:0.9:330:0.3"
genf arp "sin(2*PI*(392*eq(mod(floor(t/0.5),4),0)+493.88*eq(mod(floor(t/0.5),4),1)+587.33*eq(mod(floor(t/0.5),4),2)+493.88*eq(mod(floor(t/0.5),4),3))*t)*exp(-4.8*mod(t,0.5))*0.5" 29.0 "lowpass=f=2600, aecho=0.8:0.85:250:0.3"
genf sub "sin(2*PI*65.41*t)*exp(-6*mod(t,0.8))*0.9" 29.0 "lowpass=f=150"
genf lift "(sin(2*PI*261.63*t)+sin(2*PI*392*t)+sin(2*PI*523.25*t))*exp(-1.5*t)*0.7" 3.0 "aecho=0.8:0.85:220:0.25"
genf swish "(random(0)*2-1)*exp(-24*(t-0.15)^2)" 0.4 "lowpass=f=1400, highpass=f=400, aecho=0.8:0.85:24:0.2"
rows=(
 "pad 0 0.34"
 "arp 200 0.26"
 "sub 200 0.28"
 "swish 3200 0.22" "swish 6400 0.22" "swish 9600 0.22" "swish 12800 0.22"
 "swish 16000 0.22" "swish 19200 0.22" "swish 22400 0.22" "swish 25600 0.28"
 "lift 25600 0.42"
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; if [ "$1" = "pad" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=2[a$i];"; elif [ "$1" = "arp" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=2.5[a$i];"; else fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; fi; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.0,acompressor=threshold=-20dB:ratio=3:attack=14:release=200,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.97,lowpass=f=15000,afade=t=out:st=27.9:d=0.7,atrim=0:28.8,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
