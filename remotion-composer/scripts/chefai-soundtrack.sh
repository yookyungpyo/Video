#!/usr/bin/env bash
# Warm cozy ambient for the "chef AI 7 concepts" explainer (~36.0s, 1080f@30fps,
# 9 scenes × 120f). Continuous pad + gentle arpeggio + soft pulse + a warm swell
# on the closing (star-dish) scene (≈ 32.0s).
# Usage: bash scripts/chefai-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/chefai-reel.mp4}"; OUT="${2:-../projects/cardnews/chefai-reel-sound.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
genf pad "(sin(2*PI*130.81*t)+0.85*sin(2*PI*196*t)+0.7*sin(2*PI*261.63*t)+0.5*sin(2*PI*329.63*t))*0.17*(0.9+0.1*sin(2*PI*0.07*t))" 36.6 "lowpass=f=1500, aecho=0.8:0.9:330:0.3"
genf arp "sin(2*PI*(392*eq(mod(floor(t/0.5),4),0)+493.88*eq(mod(floor(t/0.5),4),1)+587.33*eq(mod(floor(t/0.5),4),2)+493.88*eq(mod(floor(t/0.5),4),3))*t)*exp(-4.8*mod(t,0.5))*0.5" 36.2 "lowpass=f=2600, aecho=0.8:0.85:250:0.3"
genf sub "sin(2*PI*65.41*t)*exp(-6*mod(t,0.6))*0.9" 36.2 "lowpass=f=150"
genf lift "(sin(2*PI*261.63*t)+sin(2*PI*392*t)+sin(2*PI*523.25*t))*exp(-1.6*t)*0.7" 2.6 "aecho=0.8:0.85:220:0.25"
genf swish "(random(0)*2-1)*exp(-24*(t-0.15)^2)" 0.4 "lowpass=f=1400, highpass=f=400, aecho=0.8:0.85:24:0.2"
rows=(
 "pad 0 0.34"
 "arp 300 0.28"
 "sub 300 0.28"
 "swish 4000 0.2" "swish 12000 0.2" "swish 20000 0.2" "swish 28000 0.2"
 "lift 32000 0.44" "swish 32000 0.26"
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; if [ "$1" = "pad" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=2[a$i];"; elif [ "$1" = "arp" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=2.5[a$i];"; else fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; fi; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.0,acompressor=threshold=-20dB:ratio=3:attack=14:release=200,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.97,lowpass=f=15000,afade=t=out:st=35.0:d=0.7,atrim=0:36.0,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
