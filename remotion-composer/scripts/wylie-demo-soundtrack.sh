#!/usr/bin/env bash
# Soundtrack for the WylieDemo product-demo video (34s, 1020f@30fps).
# Calm pad bed + soft mouse clicks on every cursor click + light key ticks while
# the contact form is typed + airy swishes on page transitions and the outro.
# Usage: bash scripts/wylie-demo-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../renders/wylie-demo/wylie-demo-silent.mp4}"; OUT="${2:-../renders/wylie-demo/wylie-demo.mp4}"
AD="$(mktemp -d)"; SR=44100; DUR=34
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
genf pad "(sin(2*PI*196*t)+sin(2*PI*246.94*t)+sin(2*PI*293.66*t)+0.5*sin(2*PI*392*t))*0.25*(0.85+0.15*sin(2*PI*0.06*t))" $DUR "lowpass=f=1100, aecho=0.8:0.85:220:0.3"
genf click "(random(0)*2-1)*exp(-90*t)*0.6 + sin(2*PI*1900*t)*exp(-70*t)*0.4" 0.08 "highpass=f=700, lowpass=f=6000"
genf tick "(random(0)*2-1)*exp(-160*t)*0.5 + sin(2*PI*2600*t)*exp(-120*t)*0.3" 0.05 "highpass=f=1200, lowpass=f=7000"
genf swish "(random(0)*2-1)*exp(-22*(t-0.15)^2)" 0.35 "lowpass=f=1800, highpass=f=400, aecho=0.8:0.8:18:0.25"
genf chime "(sin(2*PI*784*t)+0.6*sin(2*PI*1175*t)+0.4*sin(2*PI*1568*t))*exp(-4*t)" 1.2 "aecho=0.8:0.8:40|80:0.35|0.2"
ms(){ echo $(( $1 * 1000 / 30 )); }
rows=("pad 0 0.20")
for f in 212 306 466 547 604 658 794; do rows+=("click $(ms $f) 0.55"); done
for f in 228 482; do rows+=("swish $(ms $f) 0.30"); done
rows+=("swish $(ms 905) 0.30" "chime $(ms 930) 0.30" "chime $(ms 872) 0.18")
# key ticks: field start frame, char count, frames per char
for spec in "551 3 7" "608 3 7" "662 17 3" "798 45 2"; do
  set -- $spec; s=$1; n=$2; p=$3
  for ((i=0;i<n;i+=1)); do
    [ "$p" -le 2 ] && [ $((i%2)) -eq 1 ] && continue
    rows+=("tick $(ms $((s + i*p))) 0.35")
  done
done
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; if [ "$1" = "pad" ]; then fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=in:st=0:d=2[a$i];"; else fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; fi; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.2,acompressor=threshold=-20dB:ratio=3:attack=10:release=200,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.97,afade=t=out:st=32.6:d=1.4,atrim=0:$DUR,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
