#!/usr/bin/env bash
# Dark editorial soundtrack for the "성과의 도미노" 5-card video (~19.0s, 570f@30fps).
# Cuts (frames 110/220/330/450) = 3.67 / 7.33 / 11.00 / 15.00 s. Wooden knocks land
# on each domino topple; a bright "catch" when the last tile is HELD (개입).
# Usage: bash scripts/domino-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/domino-video.mp4}"; OUT="${2:-../projects/cardnews/domino-video-sound.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
# low, moody drone (A2 + D3 + A3)
genf pad "(sin(2*PI*110*t)+sin(2*PI*146.83*t)+sin(2*PI*220*t))*0.3*(0.85+0.15*sin(2*PI*0.06*t))" 19.4 "lowpass=f=760, aecho=0.8:0.85:240:0.3"
# wooden domino knock ("tok")
genf knock "sin(2*PI*(190-90*t)*t)*exp(-30*t) + (random(0)*2-1)*exp(-95*t)*0.5" 0.3 "lowpass=f=1300"
# deeper impact for the heavy fall
genf impact "sin(2*PI*(120-52*t)*t)*exp(-13*t)" 0.5 "lowpass=f=480, aecho=0.8:0.7:70:0.25"
# bright, hopeful catch for the held tile
genf catch "(sin(2*PI*784*t)+0.55*sin(2*PI*1176*t))*exp(-6.5*t)" 0.8 "aecho=0.8:0.8:22|44:0.32|0.2"
# soft low sub swell under 하향
genf sub "sin(2*PI*70*t)*exp(-4*t)" 0.7 "lowpass=f=200"
rows=(
 "pad 0 0.24"
 "knock 700 0.42"
 "knock 3950 0.8"
 "knock 7640 0.8"
 "knock 11320 0.78" "knock 11680 0.72" "impact 11500 0.55" "sub 11300 0.5"
 "catch 15380 0.72" "knock 15380 0.35"
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; if [ "$1" = "pad" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=2[a$i];"; else fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; fi; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.4,acompressor=threshold=-20dB:ratio=3:attack=12:release=200,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.97,lowpass=f=15000,afade=t=out:st=18.3:d=0.5,atrim=0:19.0,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
