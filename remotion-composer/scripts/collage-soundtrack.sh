#!/usr/bin/env bash
# Light collage soundtrack for the "Collage" video (17.2s, 30fps), all
# ffmpeg-synthesized (no external assets): paper-flip swishes on scene cuts,
# woody stamp thunks on the keyword cards, coin clinks for the wallet coins,
# soft tag ticks, over a minimal beat (soft kick / hat / clap).
#
# Usage: bash scripts/collage-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/spend-collage.mp4}"
OUT="${2:-../projects/cardnews/spend-collage-sound.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }

# beat parts + sfx
genf kick  "sin(2*PI*55*t - 6*exp(-30*t))*exp(-13*t)" 0.35 "lowpass=f=220, volume=1.2"
genf hat   "(random(0)*2-1)*exp(-95*t)" 0.10 "highpass=f=7000"
genf clap  "(random(0)*2-1)*exp(-38*t)" 0.16 "bandpass=f=1600:width_type=h:w=2200, aecho=0.8:0.8:8|16:0.5|0.3"
genf paper "(random(0)*2-1)*exp(-30*(t-0.10)^2)" 0.30 "highpass=f=700, bandpass=f=2200:width_type=h:w=2600, aecho=0.8:0.8:18:0.25"
genf stamp "sin(2*PI*95*t)*exp(-26*t) + sin(2*PI*240*t)*exp(-42*t)*0.3 + (random(0)*2-1)*exp(-70*t)*0.6" 0.26 "lowpass=f=1300"
genf coin  "(sin(2*PI*2300*t)+0.7*sin(2*PI*3100*t)+0.5*sin(2*PI*4300*t))*exp(-16*t)" 0.36 "highpass=f=1500, aecho=0.8:0.8:14|26:0.35|0.2"
genf tick  "sin(2*PI*1200*t)*exp(-55*t)*0.6 + (random(0)*2-1)*exp(-120*t)*0.4" 0.08 "bandpass=f=1800:width_type=h:w=2400"

# one 2.4s bar (100 BPM): kick on beats, hat offbeats, clap backbeat
barrows=("kick 0 0.55" "kick 600 0.55" "kick 1200 0.55" "kick 1800 0.55" "hat 300 0.22" "hat 900 0.22" "hat 1500 0.22" "hat 2100 0.22" "clap 600 0.30" "clap 1800 0.30")
inp=""; fc=""; lab=""; n=${#barrows[@]}
for i in "${!barrows[@]}"; do set -- ${barrows[$i]}; inp+=" -i $AD/$1.wav"; fc+="[$i]adelay=$2:all=1,volume=$3[b$i];"; lab+="[b$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0,apad=whole_dur=2.4,atrim=0:2.4[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/bar.wav"
ffmpeg -y -v error -stream_loop 8 -i "$AD/bar.wav" -t 17.2 -af "lowpass=f=9000,volume=0.30" "$AD/beat.wav"

# event-synced placement: "file delay_ms volume"
rows=(
 "beat 0 0.26"
 "paper 80 0.34" "paper 2960 0.32" "paper 6620 0.32" "paper 10300 0.32" "paper 13960 0.32"
 "stamp 420 0.46" "stamp 700 0.46" "stamp 3300 0.44" "stamp 6960 0.44" "stamp 10600 0.44" "stamp 14300 0.46"
 "coin 1150 0.34" "coin 1300 0.30" "coin 1460 0.26" "coin 15400 0.32"
 "tick 3880 0.17" "tick 4040 0.17" "tick 4200 0.17"
 "tick 7540 0.17" "tick 7700 0.17" "tick 7860 0.17"
 "tick 11240 0.17" "tick 11400 0.17" "tick 11560 0.17"
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.0,acompressor=threshold=-20dB:ratio=3:attack=12:release=180,alimiter=limit=0.96,lowpass=f=16000,afade=t=out:st=16.7:d=0.5,atrim=0:17.2,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"
rm -rf "$AD"
