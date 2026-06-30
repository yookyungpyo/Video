#!/usr/bin/env bash
# Light collage soundtrack for the "EnjoyCollage" video (~30.3s, 30fps), all
# ffmpeg-synthesized (no external assets): paper-flip swishes on scene cuts,
# woody stamp thunks on the keyword cards, bright chime sparkles on the climax,
# soft tag ticks, over a minimal beat (soft kick / hat / clap).
#
# Usage: bash scripts/enjoy-soundtrack.sh <in.mp4> <out.mp4>
set -euo pipefail
IN="${1:-../projects/cardnews/enjoy-collage.mp4}"
OUT="${2:-../projects/cardnews/enjoy-collage-sound.mp4}"
AD="$(mktemp -d)"; SR=44100
genf(){ ffmpeg -y -v error -f lavfi -i "aevalsrc=exprs='$2':d=$3:s=$SR" -af "$4" -ac 1 "$AD/$1.wav"; }

# beat parts + sfx
genf kick  "sin(2*PI*55*t - 6*exp(-30*t))*exp(-13*t)" 0.35 "lowpass=f=220, volume=1.2"
genf hat   "(random(0)*2-1)*exp(-95*t)" 0.10 "highpass=f=7000"
genf clap  "(random(0)*2-1)*exp(-38*t)" 0.16 "bandpass=f=1600:width_type=h:w=2200, aecho=0.8:0.8:8|16:0.5|0.3"
genf paper "(random(0)*2-1)*exp(-30*(t-0.10)^2)" 0.30 "highpass=f=700, bandpass=f=2200:width_type=h:w=2600, aecho=0.8:0.8:18:0.25"
genf stamp "sin(2*PI*95*t)*exp(-26*t) + sin(2*PI*240*t)*exp(-42*t)*0.3 + (random(0)*2-1)*exp(-70*t)*0.6" 0.26 "lowpass=f=1300"
genf chime "(sin(2*PI*1860*t)+0.7*sin(2*PI*2480*t)+0.5*sin(2*PI*3720*t))*exp(-9*t)" 0.5 "highpass=f=1200, aecho=0.8:0.85:18|34:0.4|0.25"
genf tick  "sin(2*PI*1200*t)*exp(-55*t)*0.6 + (random(0)*2-1)*exp(-120*t)*0.4" 0.08 "bandpass=f=1800:width_type=h:w=2400"

# one 2.4s bar (100 BPM): kick on beats, hat offbeats, clap backbeat
barrows=("kick 0 0.55" "kick 600 0.55" "kick 1200 0.55" "kick 1800 0.55" "hat 300 0.22" "hat 900 0.22" "hat 1500 0.22" "hat 2100 0.22" "clap 600 0.30" "clap 1800 0.30")
inp=""; fc=""; lab=""; n=${#barrows[@]}
for i in "${!barrows[@]}"; do set -- ${barrows[$i]}; inp+=" -i $AD/$1.wav"; fc+="[$i]adelay=$2:all=1,volume=$3[b$i];"; lab+="[b$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0,apad=whole_dur=2.4,atrim=0:2.4[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/bar.wav"
ffmpeg -y -v error -stream_loop 13 -i "$AD/bar.wav" -t 30.4 -af "lowpass=f=9000,volume=0.30" "$AD/beat.wav"

# event-synced placement: "file delay_ms volume"
# cut boundaries (ms): 0, 4666, 9666, 14666, 20000, 25000
rows=(
 "beat 0 0.26"
 "paper 60 0.34" "paper 4666 0.32" "paper 9666 0.32" "paper 14666 0.36" "paper 20000 0.32" "paper 25000 0.32"
 "stamp 300 0.42" "stamp 480 0.42" "stamp 660 0.42"
 "stamp 4940 0.46" "stamp 9940 0.44" "stamp 10210 0.40"
 "stamp 14940 0.46" "stamp 15210 0.54"
 "stamp 20270 0.46" "stamp 25270 0.44" "stamp 25540 0.50"
 "chime 15210 0.30" "chime 15670 0.26" "chime 15930 0.22" "chime 25540 0.30"
 "tick 5540 0.17" "tick 5700 0.17" "tick 5870 0.17"
 "tick 10600 0.17" "tick 10770 0.17" "tick 10940 0.17"
 "tick 20940 0.17" "tick 21100 0.17" "tick 21270 0.17"
)
inp=""; fc=""; lab=""; n=${#rows[@]}
for i in "${!rows[@]}"; do set -- ${rows[$i]}; inp+=" -i $AD/$1.wav"; fc+="[$i]adelay=$2:all=1,volume=$3[a$i];"; lab+="[a$i]"; done
fc+="${lab}amix=inputs=$n:normalize=0:dropout_transition=0[mx];"
fc+="[mx]volume=3.0,acompressor=threshold=-20dB:ratio=3:attack=12:release=180,alimiter=limit=0.96,lowpass=f=16000,afade=t=out:st=29.8:d=0.5,atrim=0:30.4,aformat=channel_layouts=stereo[out]"
ffmpeg -y -v error $inp -filter_complex "$fc" -map "[out]" "$AD/track.wav"
ffmpeg -y -v error -i "$IN" -i "$AD/track.wav" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
echo "Wrote $OUT"
rm -rf "$AD"
