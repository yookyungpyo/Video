#!/usr/bin/env bash
# Motivational workout soundtrack for the athletic quote reel (~17.9s, 536f@30fps).
# Scene changes at frames 104/208/312/416 = 3.47/6.93/10.40/13.87 s.
# Usage: bash scripts/quote-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/quote-reel.mp4}"; OUT="${2:-../projects/cardnews/quote-reel-sound.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
# warm uplifting pad (C major: C3 E3 G3 + C4)
genf pad "(sin(2*PI*130.81*t)+sin(2*PI*164.81*t)+sin(2*PI*196*t)+0.6*sin(2*PI*261.63*t))*0.26*(0.9+0.1*sin(2*PI*0.12*t))" 18.4 "lowpass=f=1400, aecho=0.8:0.85:220:0.28"
# soft steady sub-kick pulse every 0.5s (amplitude envelope via mod)
genf pulse "sin(2*PI*58*t)*exp(-13*mod(t,0.5))" 18.0 "lowpass=f=180"
# soft closed-hat tick on the off-beat for gentle drive
genf hat "(random(0)*2-1)*exp(-120*mod(t+0.25,0.5))*0.5" 18.0 "highpass=f=6000, lowpass=f=12000"
# whoosh at scene changes
genf whoosh "(random(0)*2-1)*exp(-24*(t-0.14)^2)" 0.35 "lowpass=f=1800, highpass=f=400, aecho=0.8:0.8:22:0.25"
# bright swell for the climax scene (r4 sprint)
genf swell "(sin(2*PI*523.25*t)+0.6*sin(2*PI*659.25*t)+0.4*sin(2*PI*784*t))*exp(-2.2*t)" 1.4 "aecho=0.8:0.8:24|48:0.3|0.2"
rows=(
 "pad 0 0.30"
 "pulse 300 0.5"
 "hat 300 0.28"
 "whoosh 3470 0.5" "whoosh 6930 0.5" "whoosh 10400 0.5" "whoosh 13870 0.55"
 "swell 13870 0.5"
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; if [ "$1" = "pad" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=1.5[a$i];"; else fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; fi; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.2,acompressor=threshold=-20dB:ratio=3:attack=12:release=180,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.97,lowpass=f=16000,afade=t=out:st=17.2:d=0.6,atrim=0:17.85,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
