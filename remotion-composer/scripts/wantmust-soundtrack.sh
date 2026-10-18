#!/usr/bin/env bash
# Clean motivational soundtrack for "You want → You must" (74s, 2220f@30fps).
# ffmpeg-synthesized: warm chord pad (F intro → C–G–Am–F, one chord per pair →
# F–G recap → C resolve on the close), a soft ~86 BPM pulse under the 20 pairs
# (one 2.8s bar per pair), and per pair: swish (want card) / blip (word) /
# rising whoop (arrow) / thump + melody chime (must card lands).
# Pairs start at frame 200 (6.667s) and repeat every 84f (2.8s).
# Usage: bash scripts/wantmust-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/want-must/renders/want-must-silent.mp4}"; OUT="${2:-../projects/want-must/renders/want-must.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }
# chord <name> <f1> <f2> <f3> <bass> <dur>  (soft attack/release so neighbours crossfade)
chord(){ genf "$1" "(sin(2*PI*$2*t)+sin(2*PI*$3*t)+0.8*sin(2*PI*$4*t)+0.6*sin(2*PI*$5*t))*0.25*min(1,t/0.25)*max(0,min(1,($6-t)/0.6))" "$6" "lowpass=f=1100, aecho=0.8:0.85:180:0.3"; }
chime(){ genf "$1" "(sin(2*PI*$2*t)*exp(-5*t)+0.3*sin(2*PI*$2*4*t)*exp(-13*t))*0.8" 1.5 "aecho=0.8:0.8:40|70:0.3|0.2"; }

# --- sources ---------------------------------------------------------------
chord padF0 261.63 349.23 440.00 87.31 7.1
chord padC 261.63 329.63 392.00 65.41 3.2
chord padG 246.94 293.66 392.00 98.00 3.2
chord padAm 261.63 329.63 440.00 110.00 3.2
chord padF 261.63 349.23 440.00 87.31 3.2
chord padF1 261.63 349.23 440.00 87.31 3.6
chord padG1 246.94 293.66 392.00 98.00 3.4
chord padC1 261.63 329.63 392.00 65.41 5.0
genf kick "sin(2*PI*(45*mod(t,1.4)+3.3*(1-exp(-30*mod(t,1.4)))))*exp(-7*mod(t,1.4))" 56 "lowpass=f=220"
genf snap "(random(0)*2-1)*exp(-35*mod(t+0.7,1.4))" 56 "highpass=f=1200, lowpass=f=5000, aecho=0.8:0.6:25:0.25"
genf shaker "(random(0)*2-1)*exp(-70*mod(t,0.35))*(0.6+0.4*eq(mod(floor(t/0.35),2),1))" 56 "highpass=f=6000"
genf pop "sin(2*PI*(260+520*t-180*t*t)*t)*exp(-11*t)" 0.4 "lowpass=f=1500, aecho=0.8:0.8:20:0.2"
genf blip "sin(2*PI*880*t)*exp(-22*t)*0.7 + sin(2*PI*1320*t)*exp(-26*t)*0.3" 0.2 "lowpass=f=3200"
genf twinkle "(sin(2*PI*1568*t)+0.6*sin(2*PI*2349*t))*exp(-9*t)" 0.6 "aecho=0.8:0.8:16|30:0.35|0.2"
genf swish "(random(0)*2-1)*exp(-26*(t-0.12)^2)" 0.3 "lowpass=f=1600, highpass=f=500, aecho=0.8:0.8:18:0.25"
genf whoop "sin(2*PI*(400*t+1000*t*t))*sin(PI*t/0.3)" 0.3 "lowpass=f=2000, aecho=0.8:0.7:20:0.2"
genf thump "sin(2*PI*(70*t+2*(1-exp(-25*t))))*exp(-9*t)" 0.6 "lowpass=f=300"
chime c6 1046.50; chime d6 1174.66; chime e6 1318.51; chime g6 1567.98; chime a5 880.00

# one pre-mixed SFX bar per melody note (want swish → word blip → arrow whoop → must thump+chime)
MEL=(e6 d6 c6 a5)
for k in 0 1 2 3; do
  ffmpeg -y -v error -i "$AD/swish.wav" -i "$AD/blip.wav" -i "$AD/whoop.wav" -i "$AD/thump.wav" -i "$AD/${MEL[$k]}.wav" -filter_complex \
    "[0]volume=0.16[a];[1]adelay=180:all=1,volume=0.12[b];[2]adelay=717:all=1,volume=0.12[c];[3]adelay=983:all=1,volume=0.34[d];[4]adelay=983:all=1,volume=0.16[e];[a][b][c][d][e]amix=inputs=5:normalize=0:dropout_transition=0" \
    "$AD/pairsfx$k.wav"
done

# --- placement: "<source> <ms> <volume>" ----------------------------------
PADS=(padC padG padAm padF)
rows=(
 "padF0 0 0.16"
 "twinkle 130 0.16" "pop 200 0.30" "pop 470 0.30"
 "blip 800 0.13" "blip 967 0.13" "blip 1133 0.13" "blip 1300 0.13" "blip 1467 0.13" "blip 1633 0.13" "blip 1800 0.13" "blip 1967 0.13"
 "swish 3300 0.15" "pop 3470 0.32" "whoop 3870 0.13" "thump 4330 0.34" "c6 4330 0.16"
 "blip 4870 0.11" "blip 5070 0.11" "blip 5270 0.11" "twinkle 5400 0.14"
 "kick 6667 0.30" "snap 6667 0.10" "shaker 6667 0.05"
)
for i in $(seq 0 19); do
  t0=$((6667 + 2800 * i))
  rows+=("${PADS[$((i % 4))]} $((t0 - 200)) 0.16" "pairsfx$((i % 4)) $((t0 - 50)) 1.0")
done
rows+=(
 "padF1 62500 0.16" "padG1 65900 0.16"
 "swish 62640 0.15" "pop 62730 0.30" "twinkle 66333 0.16"
)
for k in $(seq 0 19); do rows+=("blip $((63133 + 133 * k)) 0.09"); done
rows+=(
 "padC1 69000 0.18"
 "swish 68950 0.15" "whoop 69000 0.12" "pop 69200 0.30" "thump 69470 0.32"
 "c6 69470 0.16" "e6 69620 0.14" "g6 69770 0.12"
 "blip 70130 0.13" "twinkle 70670 0.14"
)

inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do
  set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"
  case "$1" in
    kick|snap|shaker) fc+="[$i]adelay=$2:all=1,volume=$3,afade=t=out:st=62.1:d=0.6[a$i];" ;;
    *) fc+="[$i]adelay=$2:all=1,volume=$3[a$i];" ;;
  esac
  lab+="[a$i]"
done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=2.6,acompressor=threshold=-20dB:ratio=3:attack=14:release=200,loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.97,lowpass=f=15000,afade=t=out:st=73:d=1,atrim=0:74,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"; rm -rf "$AD"
